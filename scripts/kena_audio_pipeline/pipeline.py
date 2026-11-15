#!/usr/bin/env python3
"""Replay or rerun the recording-specific Kena audio-generation pipeline.

Outputs go to a new directory. This command does not overwrite published files,
modify the source HTML, or perform Git operations. Follow AGENTS.md first.
"""
from pathlib import Path
import argparse
import bisect
import copy
import gc
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINTS = Path(__file__).resolve().parent / 'checkpoints'


def read_json(path):
    return json.loads(path.read_text())


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_inputs(manifest):
    for name, expected in manifest['checkpointSha256'].items():
        require(sha256(CHECKPOINTS / name) == expected, 'Checkpoint changed: ' + name)
    for name, key in [('kena_upanishad.html', 'sourceHtmlSha256'), ('kena_upanishad.opus', 'audioSha256')]:
        require(sha256(ROOT / name) == manifest[key], name + ' changed; reconcile text/audio and review the alignment before regeneration.')


def decode(audio_path, output):
    require(shutil.which('ffmpeg'), 'FFmpeg is required for decoding.')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-n',
                    '-i', str(audio_path), '-ar', '16000', '-ac', '1', '-f', 'f32le', str(output)], check=True)


def find_pauses(audio, manifest, np):
    frame = int(manifest['sampleRate'] * manifest['frameSeconds'])
    blocks = audio[:len(audio) // frame * frame].reshape(-1, frame)
    rms = 20 * np.log10(np.sqrt((blocks * blocks).mean(axis=1)) + 1e-9)
    low = rms < manifest['pauseThresholdDb']
    for _ in range(manifest['bridgePasses']):
        edges = np.diff(np.pad(low.astype(int), (1, 1)))
        starts, ends = np.where(edges == 1)[0], np.where(edges == -1)[0]
        for left, right in zip(ends[:-1], starts[1:]):
            if right - left <= manifest['bridgeFrames']:
                low[left:right] = True
    edges = np.diff(np.pad(low.astype(int), (1, 1)))
    starts = np.where(edges == 1)[0] * manifest['frameSeconds']
    ends = np.where(edges == -1)[0] * manifest['frameSeconds']
    return [dict(start=round(float(s), 3), end=round(float(e), 3), mid=round(float((s + e) / 2), 3))
            for s, e in zip(starts, ends) if e - s >= manifest['pauseMinimumSeconds']]


def grouped_phrases(words, sa, iast, start, end, pauses, add_punctuation=False):
    require(len(sa) == len(iast) == len(words), 'Text and alignment word counts differ.')
    cuts = [p['mid'] for p in pauses if p['end'] - p['start'] >= .60 and start + .8 < p['mid'] < end - .5]
    groups, group, current = [], [], 0
    for index, word in enumerate(words):
        target = bisect.bisect_right(cuts, word['end'] - .05)
        if target != current and group:
            groups.append((current, group))
            group = []
        current = target
        group.append(index)
    if group:
        groups.append((current, group))
    boundaries, phrases = [start] + cuts + [end], []
    for index, (number, indices) in enumerate(groups):
        a = start if index == 0 else boundaries[number]
        b = end if index == len(groups) - 1 else boundaries[groups[index + 1][0]]
        sa_suffix = (' ॥' if index == len(groups) - 1 else ' ।') if add_punctuation else ''
        ia_suffix = (' ||' if index == len(groups) - 1 else ' |') if add_punctuation else ''
        # The published closing phrases use full pause precision; verse ranges use milliseconds.
        if not add_punctuation:
            a, b = round(a, 3), round(b, 3)
        phrases.append(dict(start=a, end=b, sanskrit=' '.join(sa[j] for j in indices) + sa_suffix,
                            iast=' '.join(iast[j] for j in indices) + ia_suffix))
    return phrases


def keep_punctuation(text, pattern):
    result = []
    for token in re.findall(pattern, text):
        if token in ['।', '॥', '|', '||']:
            if result:
                result[-1] += ' ' + token
        else:
            result.append(token)
    return result


def apply_reviewed_recitation(data):
    """Keep recording-specific wording and breaks above automatic word timing."""
    review = read_json(CHECKPOINTS / 'reviewed_recitation.json')
    for key in ['sourceHtmlSha256', 'audioSha256']:
        require(review[key] == data[key], 'Recitation review belongs to a different source or recording.')
    require([c['number'] for c in review['clips']] == [c['number'] for c in data['clips']],
            'Recitation review is missing or reorders sections.')
    source_verses = {v['number']: v for v in read_json(CHECKPOINTS / 'source_verses.json')}
    def comparable(text):
        return re.sub(r'[\s।॥|]', '', text)
    for clip, reviewed in zip(data['clips'], review['clips']):
        require(abs(clip['start'] - reviewed['start']) < .000001 and abs(clip['end'] - reviewed['end']) < .000001,
                'Proposed verse boundary changed at ' + clip['number'] + '; review the saved recitation breaks before applying it.')
        phrases = copy.deepcopy(reviewed['phrases'])
        for field in ['sanskrit', 'iast']:
            source = source_verses.get(clip['number'])
            original = source[field] if source else ' '.join(p[field] for p in clip['phrases'])
            if clip['number'] == '1.1':
                original = re.sub(r'^ॐ\s*|^oṃ\s*', '', original)
            expected = comparable(original)
            for change in reviewed['sourceReplacements']:
                before, after = comparable(change[field]['before']), comparable(change[field]['after'])
                require(expected.count(before) == 1, 'Recitation spelling change is ambiguous: ' + clip['number'])
                expected = expected.replace(before, after, 1)
            require(expected == comparable(' '.join(p[field] for p in phrases)),
                    'Undeclared text change or missing words in recitation: ' + clip['number'] + ' ' + field)
        require(phrases[0]['start'] == clip['start'] and phrases[-1]['end'] == clip['end'],
                'Reviewed phrases must cover their section: ' + clip['number'])
        for index, phrase in enumerate(phrases):
            require(phrase['start'] < phrase['end'], 'Empty reviewed phrase: ' + clip['number'])
            if index:
                require(phrase['start'] == phrases[index - 1]['end'], 'Gap in reviewed phrases: ' + clip['number'])
            terminal = index == len(phrases) - 1
            sa, ia = ('॥', '||') if terminal else ('।', '|')
            require(phrase['sanskrit'].endswith(' ' + sa) and not re.search('[।॥]', phrase['sanskrit'][:-len(sa)]),
                    'Misplaced Sanskrit recitation marker: ' + clip['number'])
            require(phrase['iast'].endswith(' ' + ia) and '|' not in phrase['iast'][:-len(ia)],
                    'Misplaced IAST recitation marker: ' + clip['number'])
        clip['phrases'] = phrases
    # Literal invocation translations keep their reviewed wording and translations.
    closing = data['clips'][-1]
    closing['literalPhrases'] = copy.deepcopy(data['clips'][0]['phrases']) + closing['literalPhrases'][-1:]
    return data


def assemble(verses, rows, closing_words, pauses, manifest):
    opening = read_json(CHECKPOINTS / 'opening_invocation.json')
    clips, last = [opening], opening['end']
    require([v['number'] for v in verses] == [r['number'] for r in rows], 'Missing, reordered, or duplicate verse alignments.')
    for verse, row in zip(verses, rows):
        words = [w for w in row['words'] if w['word'].strip()]
        sa = keep_punctuation(verse['sanskrit'].replace('ॐ', ''), r'[^\s।॥]+|[।॥]')
        iast = keep_punctuation(re.sub(r'^oṃ ', '', verse['iast']), r'[^\s|]+|\|\||\|')
        candidates = [p for p in pauses if words[-1]['end'] - 1.5 < p['mid'] < words[-1]['end'] + 2.5]
        require(candidates, 'No recording pause near verse ' + verse['number'] + '; review required.')
        end = min(candidates, key=lambda p: abs(p['mid'] - words[-1]['end']))['mid']
        require(end > last, 'Non-increasing verse boundary: ' + verse['number'])
        phrases = grouped_phrases(words, sa, iast, last, end, pauses)
        clips.append(dict(number=verse['number'], label='Mantra ' + verse['number'], start=last, end=end,
                          phrases=phrases, alignmentProbability=row.get('meanProbability')))
        last = end
    metadata = read_json(CHECKPOINTS / 'metadata.json')
    sa = re.sub('[।॥]', '', ' '.join(p['sanskrit'] for p in opening['phrases'])).split() + ['हरिः', 'ॐ']
    iast = re.sub(r'\|+', '', ' '.join(p['iast'] for p in opening['phrases'])).split() + ['hariḥ', 'oṃ']
    closing = copy.deepcopy(opening)
    closing.update(number='closing-shanti', label='Closing Śānti mantra · Hariḥ Om', start=last,
                   end=metadata['recording']['duration'],
                   phrases=grouped_phrases(closing_words, sa, iast, last, metadata['recording']['duration'], pauses, True),
                   literalPhrases=copy.deepcopy(opening['phrases']) + [dict(sanskrit='हरिः ॐ', iast='hariḥ oṃ', english='Hariḥ Om; an invocation of the Divine.')],
                   words=opening['words'] + [['हरिः', 'hariḥ', 'Hari; a name of the Divine.'], ['ॐ', 'oṃ', 'Om; the sacred syllable.']],
                   english=opening['english'] + ' Hariḥ Om.')
    metadata['clips'] = clips + [closing]
    data = {key: metadata[key] for key in manifest['timingFieldOrder']}
    return apply_reviewed_recitation(data)


def verify_model(path, model_manifest):
    require(path.is_dir(), 'Supply a local model directory: ' + str(path))
    for name, expected in model_manifest['files'].items():
        require((path / name).is_file() and sha256(path / name) == expected,
                'Model file differs from the original run: ' + str(path / name))


def realign(audio, verses, manifest, args, output, np):
    # Lazy import: checkpoint replay needs no speech packages or downloaded models.
    from faster_whisper import WhisperModel
    from faster_whisper.tokenizer import Tokenizer
    require(args.seed_model is not None and args.tiny_model is not None,
            'realign requires --seed-model and --tiny-model local directories.')
    verify_model(args.seed_model, manifest['models']['seed'])
    verify_model(args.tiny_model, manifest['models']['main'])

    def load(path):
        model = WhisperModel(str(path), device='cpu', compute_type='int8', cpu_threads=2)
        tokenizer = Tokenizer(model.hf_tokenizer, model.model.is_multilingual, task='transcribe', language='hi')
        return model, tokenizer

    print('Aligning first-verse seed with the small model', flush=True)
    model, tokenizer = load(args.seed_model)
    start = manifest['seedAudioStart']
    features = model.feature_extractor(audio[start * 16000:(start + 30) * 16000])[:, :3000]
    text = verses[0]['sanskrit'].replace('ॐ', '').replace('।', '').replace('॥', '')
    first = model.find_alignment(tokenizer, [tokenizer.encode(text)], model.encode(features), 3000)[0]
    for word in first:
        word['start'] += start
        word['end'] += start
    result = [dict(number='1.1', words=first)]
    del model, tokenizer
    gc.collect()
    model, tokenizer = load(args.tiny_model)

    def align(text, following, start):
        segment = audio[int(start * 16000):int((start + 30) * 16000)]
        segment = np.pad(segment, (0, max(0, 480000 - len(segment))))
        encoded = model.encode(model.feature_extractor(segment)[:, :3000])
        tokens = tokenizer.encode(' ' + text + ' ' + following + ' ' + chr(160))
        frames = min(3000, int((len(audio) / 16000 - start) * 100))
        words = model.find_alignment(tokenizer, [tokens], encoded, frames)[0][:len(text.split())]
        require(len(words) == len(text.split()), 'Alignment omitted words; review required.')
        for word in words:
            word['start'] = round(start + word['start'], 3)
            word['end'] = round(start + word['end'], 3)
        return words

    cursor = manifest['seedCursor']
    for index, verse in enumerate(verses[1:], 1):
        text = re.sub(r'[।॥\s]+', ' ', verse['sanskrit']).strip().replace('ꣳ', 'ं').replace('ँ', 'ं')
        following = ' '.join(re.sub(r'[।॥\s]+', ' ', verses[index + 1]['sanskrit']).strip().split()[:4]) if index + 1 < len(verses) else 'ॐ शान्तिः'
        words = align(text, following, max(0, cursor - .15))
        cursor = words[-1]['end']
        probability = round(float(np.mean([w['probability'] for w in words])), 3)
        result.append(dict(number=verse['number'], words=words, meanProbability=probability))
        write_json(output / 'verse_alignment.json', result)
        print(verse['number'], cursor, 'probability', probability, flush=True)
        require(probability >= .08, 'Low-confidence alignment; preserve this candidate for review.')
    parts = [
        'ॐ आप्यायन्तु ममाङ्गानि वाक्प्राणश्चक्षुः श्रोत्रमथो बलमिन्द्रियाणि च सर्वाणि सर्वं ब्रह्मौपनिषदम्',
        'माहं ब्रह्म निराकुर्यां मा मा ब्रह्म निराकरोत् अनिराकरणमस्त्वनिराकरणं मेऽस्तु',
        'तदात्मनि निरते य उपनिषत्सु धर्मास्ते मयि सन्तु ते मयि सन्तु ॐ शान्तिः शान्तिः शान्तिः हरिः ॐ']
    cursor, closing = manifest['closingAlignmentStart'], []
    for index, text in enumerate(parts):
        following = ' '.join(parts[index + 1].split()[:4]) if index + 1 < len(parts) else ''
        words = align(text, following, cursor - .15)
        closing.extend(words)
        cursor = words[-1]['end']
    write_json(output / 'closing_alignment.json', closing)
    return result, closing


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['replay', 'realign', 'download'])
    parser.add_argument('--output-dir', type=Path, help='New or empty directory; default is a unique temporary directory.')
    parser.add_argument('--seed-model', type=Path)
    parser.add_argument('--tiny-model', type=Path)
    parser.add_argument('--yt-dlp-script', type=Path, help='Optional current yt-dlp Python bundle, instead of the installed executable.')
    parser.add_argument('--js-runtime', help='Optional yt-dlp JavaScript runtime, e.g. node.')
    parser.add_argument('--check', action='store_true', help='Require timing and HTML to match the published edition exactly.')
    parser.add_argument('--browser-test', action='store_true', help='Also run the existing Playwright offline test against the published edition.')
    args = parser.parse_args()
    output = args.output_dir.resolve() if args.output_dir else Path(tempfile.mkdtemp(prefix='kena_audio_pipeline_'))
    require(not output.exists() or output.is_dir(), 'Output path must be a directory.')
    require(not output.exists() or not any(output.iterdir()), 'Output directory must be empty; existing work will not be overwritten.')
    output.mkdir(parents=True, exist_ok=True)
    manifest = read_json(CHECKPOINTS / 'manifest.json')
    if args.mode == 'download':
        require(args.yt_dlp_script is not None or shutil.which('yt-dlp'), 'Install a current yt-dlp or supply --yt-dlp-script.')
        command = [sys.executable, str(args.yt_dlp_script)] if args.yt_dlp_script else ['yt-dlp']
        if args.js_runtime:
            command += ['--js-runtimes', args.js_runtime, '--remote-components', 'ejs:github']
        command += ['--no-playlist', '-f', 'bestaudio', '-x', '--audio-format', 'best',
                    '--write-info-json', '-P', str(output), '-o', 'kena_upanishad.%(ext)s', manifest['sourceUrl']]
        subprocess.run(command, check=True)
        print('Downloaded candidate audio to', output, '\nCompare it with the existing recording before replacing anything.')
        return
    verify_inputs(manifest)
    if args.mode == 'realign':
        require(args.seed_model is not None and args.tiny_model is not None,
                'realign requires --seed-model and --tiny-model local directories.')
    import numpy as np
    pcm = output / 'recording.f32'
    decode(ROOT / 'kena_upanishad.opus', pcm)
    audio = np.fromfile(pcm, dtype=np.float32)
    pauses = find_pauses(audio, manifest, np)
    write_json(output / 'pauses.json', pauses)
    verses = read_json(CHECKPOINTS / 'source_verses.json')
    if args.mode == 'realign':
        rows, closing = realign(audio, verses, manifest, args, output, np)
    else:
        rows = read_json(CHECKPOINTS / 'verse_alignment.json')
        closing = read_json(CHECKPOINTS / 'closing_alignment.json')
    data = assemble(verses, rows, closing, pauses, manifest)
    timing_path, html_path = output / 'timing.json', output / 'kena_upanishad_audio.html'
    write_json(timing_path, data)
    subprocess.run([sys.executable, str(ROOT / 'scripts/build_kena_audio.py'),
                    '--timing-file', str(timing_path), '--output', str(html_path)], cwd=ROOT, check=True)
    report = dict(mode=args.mode, sourceHtmlSha256=manifest['sourceHtmlSha256'], audioSha256=manifest['audioSha256'],
                  pcm_matches_original=sha256(pcm) == manifest['pcmSha256'],
                  timing_matches_published=data == read_json(ROOT / 'docs/kena-audio-timing.json'),
                  html_matches_published=sha256(html_path) == sha256(ROOT / 'kena_upanishad_audio.html'),
                  htmlSha256=sha256(html_path), sections=len(data['clips']))
    write_json(output / 'report.json', report)
    print(json.dumps(report, indent=2))
    print('Pipeline outputs:', output)
    if args.check:
        require(report['timing_matches_published'] and report['html_matches_published'],
                'Generated candidate differs from the published edition. Inspect outputs; no published files were overwritten.')
    if args.browser_test:
        require(report['html_matches_published'], 'Review a differing candidate before testing the published edition as its equivalent.')
        subprocess.run(['node', str(ROOT / 'tests/kena_audio.cjs')], cwd=ROOT, check=True)


if __name__ == '__main__':
    # Match the successful run's CPU settings and avoid Intel OpenMP oversubscription.
    for key, value in {'OMP_NUM_THREADS': '2', 'MKL_NUM_THREADS': '2', 'KMP_BLOCKTIME': '0',
                       'OPENBLAS_NUM_THREADS': '1', 'VECLIB_MAXIMUM_THREADS': '1'}.items():
        os.environ.setdefault(key, value)
    try:
        main()
    except (ValueError, ImportError, FileNotFoundError, subprocess.CalledProcessError) as error:
        print('Pipeline stopped:', error, file=sys.stderr)
        sys.exit(1)
