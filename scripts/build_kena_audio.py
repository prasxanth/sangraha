#!/usr/bin/env python3
"""Build a self-contained audio edition from the reconciled source and timing data.

Does not modify the source HTML or recording. Follow AGENTS.md freshness checks first.
"""
from pathlib import Path
import argparse
import base64
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--timing-file', type=Path, default=ROOT / 'docs/kena-audio-timing.json')
parser.add_argument('--output', type=Path, default=ROOT / 'kena_upanishad_audio.html')
args = parser.parse_args()
source = (ROOT / 'kena_upanishad.html').read_text()
data = json.loads(args.timing_file.read_text())
assert hashlib.sha256((ROOT / 'kena_upanishad.html').read_bytes()).hexdigest() == data['sourceHtmlSha256'], 'Source HTML changed: reconcile the timing and source text before rebuilding.'
audio = (ROOT / 'kena_upanishad.opus').read_bytes()
assert hashlib.sha256(audio).hexdigest() == data['audioSha256'], 'Audio changed: verify timing before rebuilding.'

def invocation_card(clip, title):
    body = '<div class="v-label">' + html.escape(title) + '</div>'
    for key, cls, lang in [('sanskrit', 'v-sanskrit', 'sa'), ('iast', 'v-translit', 'sa-Latn')]:
        body += '<div class="' + cls + '" lang="' + lang + '">' + html.escape(' '.join(p[key] for p in clip['phrases'])) + '</div>'
    body += '<div class="transl"><strong>English rendering:</strong> ' + html.escape(clip['english']) + '</div>'
    body += '<div class="audio-notice">Line breaks follow the recitation’s major pauses. Pada-viccheda separates grammatical words; the chant retains their joined forms.</div>'
    body += '<div class="wbw-label">Pada-viccheda · ' + title + '</div><table class="wbw"><thead><tr><th>Sanskrit</th><th>IAST</th><th>Meaning</th></tr></thead><tbody>'
    for row in clip['words']:
        body += '<tr>' + ''.join('<td>' + html.escape(v) + '</td>' for v in row) + '</tr>'
    body += '</tbody></table>'
    number = clip['number']
    return '<div class="class-item" data-mantra="' + number + '"><div class="class-hdr" onclick="openMantra(\'' + number + '\',true)"><div class="class-num">' + number + '</div><div class="class-name">' + title + '</div><div class="class-arr">›</div></div><div class="class-body">' + body + '</div></div>\n'

s = source.replace('<div class="class-item" data-mantra="1.1">', invocation_card(data['clips'][0], 'Opening invocation') + '<div class="class-item" data-mantra="1.1">', 1)
closing = next((c for c in data['clips'] if c['number'] == 'closing-shanti'), None)
if closing:
    start = s.index('<div class="class-item" data-mantra="4.9">')
    depth = 0
    for match in re.finditer(r'<div\b[^>]*>|</div>', s[start:]):
        depth += -1 if match.group().startswith('</') else 1
        if depth == 0:
            end = start + match.end()
            s = s[:end] + '\n' + invocation_card(closing, 'Closing invocation') + s[end:]
            break
    else:
        raise ValueError('Could not locate the end of mantra 4.9')

s = s.replace('<title>Kena Upaniṣad · केनोपनिषद्</title>', '<title>Kena Upaniṣad · Offline Audio Edition</title>', 1)
s = re.sub(r'<link href="https://fonts.googleapis.com[^>]+>', '', s, count=1)
s = s.replace('const number=reference.match(/\\d+\\.\\d+/)[0];', "const number=(reference.match(/\\d+\\.\\d+/)||[reference.includes('Closing')?'closing-shanti':'shanti'])[0];")
s = s.replace('KENA_PHRASE_TRANSLATIONS[number].forEach(phrase=>{', '(KENA_PHRASE_TRANSLATIONS[number]||[]).forEach(phrase=>{')
s = s.replace('</style>', (ROOT / 'assets/kena_audio/player.css').read_text() + '\n</style>', 1)
s = s.replace('Read the Sanskrit. Turn to the meaning.<br>Stay with the question.', 'Listen to the chant. Follow the Sanskrit.<br>Opening and closing invocations, and all 34 verses.<span class="audio-notice" style="display:block">Audio is included in this file. Plays offline · default 0.75× · adjustable 0.25–1.0×.</span><span class="audio-notice" style="display:block">Recitation: Swami Paramarthananda · Yogamalika. <a href="https://www.youtube.com/watch?v=4YirltXJXtA" target="_blank" rel="noopener">Recording source ↗</a></span>', 1)
s = s.replace('<span class="app-header-logo">Kena Upaniṣad</span>', '<span class="app-header-logo">Kena · Audio</span>', 1)
s = s.replace('id="home-read" onclick="navigate(\'read\')">Read', 'id="home-read" onclick="navigate(\'read\')">Listen &amp; read', 1)
s = s.replace('  <div id="content">', '  <div id="audio-status" role="status" aria-live="polite"></div>\n  <div id="content">', 1)
addon = '<audio id="recitation-audio" preload="metadata" src="data:audio/ogg;codecs=opus;base64,' + base64.b64encode(audio).decode() + '"></audio>\n<script>\nconst KENA_AUDIO = ' + json.dumps(data, ensure_ascii=False) + ';\n'
for clip in data['clips']:
    if clip['number'] not in ['shanti', 'closing-shanti']:
        continue
    key = json.dumps(clip['number'])
    addon += 'KENA_MANTRA_META[' + key + ']=' + json.dumps(dict(title=clip['label'], section='Invocation', art='source', excerpt=False, sourceGroup=clip['number'], wordContext=None)) + ';\n'
    addon += 'KENA_READING_ART[' + key + "]='source';\n"
    addon += 'KENA_PHRASE_TRANSLATIONS[' + key + ']=((c)=>c.literalPhrases||c.phrases)(KENA_AUDIO.clips.find(c=>c.number===' + key + " )).map(p=>({sanskrit:p.sanskrit,english:p.english||''}));\n"
addon += (ROOT / 'assets/kena_audio/player.js').read_text() + '\n</script>\n'
s = s.replace('</body>', addon + '</body>', 1)
args.output.write_text(s)
print('Wrote audio edition:', args.output, len(s.encode()), 'bytes')
