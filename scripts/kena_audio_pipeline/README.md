# Kena audio generation pipeline

This saves the successful pipeline behind `kena_upanishad_audio.html`, including the intermediate alignments that were originally in temporary files. It is specific to the supplied recording and the current Sanskrit edition. The published HTML, original HTML, original Opus audio, and reviewed timing data are never overwritten by this runner.

## Reproduce the published edition

From the repository root, with FFmpeg and NumPy available:

```sh
python3 scripts/kena_audio_pipeline/pipeline.py replay --check
```

The command creates a unique temporary output directory, decodes the existing recording, measures its pauses, reconstructs all 36 sections from the saved word alignments, and runs the HTML builder. `report.json` compares the generated timing and HTML against the published edition. `--check` fails on a difference. The output directory is printed and retained for inspection.

Choose an explicit **new or empty** output directory with `--output-dir /path/to/output`. Existing files are not overwritten. To also run the Playwright test already used to validate offline playback:

```sh
python3 scripts/kena_audio_pipeline/pipeline.py replay --check --browser-test
```

Playwright must be available to Node, as for the repository's other browser tests. `CHROME_PATH` can select the Chrome executable. The browser test checks the published edition after confirming that the generated candidate is byte-for-byte identical.

The lightweight, already-published build step remains available independently:

```sh
python3 scripts/build_kena_audio.py
```

That reads the reviewed `docs/kena-audio-timing.json` and writes the main audio HTML. Optional `--timing-file` and `--output` arguments let the pipeline build a candidate separately. Follow `AGENTS.md` before changing published files or publishing.

## What the pipeline does

1. **Audio extraction.** `yt-dlp --no-playlist -f bestaudio -x --audio-format best` selected the supplied YouTube recording's best audio stream. FFmpeg extracted Opus without re-encoding. The final file is `kena_upanishad.opus`. The original download also used `--js-runtimes node --remote-components ejs:github` while troubleshooting YouTube extraction; JavaScript support depends on the installed downloader/runtime versions.
2. **Reference text.** The 34 Sanskrit/IAST passages were extracted from the original HTML's rendered reading deck. `checkpoints/source_verses.json` preserves that exact extraction, including whitespace used by the first alignment. The source HTML hash prevents accidentally reusing it against a changed edition.
3. **Decode.** FFmpeg decodes to 16 kHz mono, little-endian float32 PCM. Passing NumPy PCM arrays to the speech tool avoids the PyAV `metadata_errors` API incompatibility encountered during the original run.
4. **Align known text.** The first verse was aligned with `Systran/faster-whisper-small` over source seconds 51–81. Its saved endpoint initializes the remaining sequence. `Systran/faster-whisper-tiny` aligns the remaining canonical verses with the following verse's first four words and a trailing nonbreaking-space token. This following-text context prevents the final word from stretching into subsequent verses. The Hindi tokenizer provides the Devanagari tokens; the Sanskrit is supplied text, not a generated translation.
5. **Review invocations.** The opening mantra's text, grammatical word division, English rendering, and pause ranges were assembled separately. The repeated closing mantra and Hariḥ Om were confirmed from the ending and aligned in three windows, starting from the saved recording-specific anchor. These anchors and the opening text are preserved, rather than silently regenerated.
6. **Measure pauses.** The decoded audio is measured in 20 ms RMS frames at −18 dB. Up to five transient frames are bridged, twice. Quiet regions lasting at least 0.38 seconds are candidates for verse boundaries; regions at least 0.60 seconds long provide major phrase breaks. Each verse cut uses the closest candidate midpoint within −1.5/+2.5 seconds of its aligned ending. A missing candidate stops the run for review.
7. **Assemble and build.** The runner retains the original Sanskrit and IAST characters/punctuation, groups them at recording pauses, adds both invocations, and embeds the original Opus bytes and existing artwork. Study retains the audited grammatical pada-viccheda; the extra unrecited Om at verse 1.1 is moved to the opening invocation in this edition only.
8. **Validate.** The replay compares timing data and HTML hashes. `tests/kena_audio.cjs` checks all sections, all 34 audited pada sequences, source-text preservation, audio identity, speed limits/default, verse stopping, repeat, continuation, mobile layouts, and blocked-network playback.

Whole-track free-transcription experiments were discarded because they skipped or repeated passages. They are not used to generate the published timings. Network/DNS/proxy troubleshooting scripts were also excluded; they were environment repairs, not part of the generation method.

## Download a fresh candidate recording

With a current yt-dlp and FFmpeg installed (the successful download used yt-dlp 2026.10.26; the older installed 2026.02.04 could not extract the audio formats):

```sh
python3 scripts/kena_audio_pipeline/pipeline.py download
```

To reproduce the original use of a separately downloaded current yt-dlp Python bundle and Node runtime:

```sh
python3 scripts/kena_audio_pipeline/pipeline.py download \
  --yt-dlp-script /path/to/yt-dlp \
  --js-runtime node
```

This downloads into a new temporary directory using the repository's `kena_upanishad` filename convention. It does not replace the existing recording. Check its codec, identity, and hash before considering replacement. A changed recording requires new alignment and review.

## Rerun the speech alignment

The original decoder was FFmpeg 6.1.1. The exact observed core package versions are saved in `requirements.txt`; the original alignment used Python 3.12.2 on an Intel Mac, CPU `int8`, and two threads. Model weights are deliberately not committed. Their repository names and file hashes are saved in `checkpoints/manifest.json`.

Install into an isolated environment, obtain the two model directories from their named Hugging Face repositories, then run:

```sh
python3.12 -m venv /tmp/kena_audio_env
/tmp/kena_audio_env/bin/pip install -r scripts/kena_audio_pipeline/requirements.txt
/tmp/kena_audio_env/bin/python scripts/kena_audio_pipeline/pipeline.py realign \
  --seed-model /path/to/faster-whisper-small \
  --tiny-model /path/to/faster-whisper-tiny
```

The runner verifies model file hashes before loading them. Local model directories allow alignment without network access. CPU thread settings match the successful run and avoid the Intel OpenMP scheduling problem observed with earlier settings. The new alignments and candidate output remain separate from published data; inspect differences before applying them. Hardware/library changes can affect alignment, even with the same model weights.

## Saved evidence and safeguards

- `checkpoints/manifest.json`: source, audio, PCM, model, checkpoint, and published-HTML hashes; calibrated anchors; pause settings; observed alignment versions.
- `source_verses.json`: the extracted Sanskrit and IAST.
- `verse_alignment.json`: the successful 34-verse word/token alignments, including the small-model first-verse seed.
- `closing_alignment.json`: the closing invocation's word/token alignment.
- `pauses.json`: the original measured pause intervals, retained for comparison with a fresh decode.
- `opening_invocation.json`: the reviewed opening text, word meanings, translations, and pause timings.
- `metadata.json`: recording metadata and the published timing file's other fields.

Input hashes and checkpoint hashes are checked before replay/alignment. A changed source or recording stops the pipeline; reconcile it rather than replacing hashes just to bypass the check. The runner does not commit, push, stage, reset, or fetch Git data. Keep the repository's freshness, backup, task-only staging, and normal-push safeguards when publishing reviewed results.

`replay_validation.json` records the successful exact replay check performed when this pipeline was saved.
