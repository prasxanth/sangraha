# Kena Upaniṣad audio edition

Open `kena_upanishad_audio.html` directly to read and listen offline. The recording and artwork are embedded in the HTML; no server, separate audio file, or internet connection is required for playback. The original study edition, `kena_upanishad.html`, is unchanged.

The edition has 36 sections: the opening Śānti mantra, all 34 study verses, and the repeated closing Śānti mantra with Hariḥ Om. Playback defaults to 0.75×, with speeds from 0.25× to 1.0×, verse seeking, restart, repeat, and optional continuation to the next section. Changing verses or leaving the reader pauses playback; opening Study keeps the selected verse available.

Recitation lines follow the recording’s audible phrases. Single daṇḍa `।` marks an internal recitation pause; double daṇḍa `॥` marks the end of a verse or invocation. IAST uses matching `|` / `||` markers. Spoken sandhi and pausal forms are saved explicitly: for example, 1.3 reads **नो मनो न विद्मः ।** / **no mano na vidmaḥ |**, without an inherited stop after मनो. Study retains the audited grammatical pada-viccheda, literal translations, word meanings, and commentaries; these separated grammatical forms can differ from the joined recitation. The unrecited extra Om at the beginning of verse 1.1 is omitted in this edition: the recording's opening Om belongs to the invocation. The original edition retains its text.

The source recording is **Kena-Upanishad**, recited by **Swami Paramarthananda**, from Yogamalika's *Divyanadam Chanting Series, Vol. 2 & 3* (1996), downloaded from [the supplied YouTube recording](https://www.youtube.com/watch?v=4YirltXJXtA). `kena_upanishad.opus` retains the downloaded Opus stream without re-encoding. The audio edition embeds those same bytes.

The complete extraction/alignment/replay workflow, model and recording hashes, saved intermediate results, and commands are in [the saved generation pipeline](../scripts/kena_audio_pipeline/README.md).

## Maintenance and validation

`kena-audio-timing.json` records section and phrase ranges in source-recording seconds, independently of playback speed. Verse alignment uses the known Sanskrit with following-verse context; cuts are centered in measured recording pauses. Automatic word timings are proposals only: `checkpoints/reviewed_recitation.json` supplies the recording-specific wording and phrase breaks, including corrections inside compound words. Every spelling change from the printed source is declared in both Sanskrit and IAST. The closing invocation is aligned separately. These are recitation boundaries, not separate word-by-word recordings.

After following the repository's freshness and preservation instructions, rebuild with:

```sh
python3 scripts/build_kena_audio.py
```

The builder reads the current source HTML, timing data, recording, and `assets/kena_audio/player.js` / `player.css`. It requires matching source and audio hashes, and writes only the separate audio edition. Reconcile and validate source-text changes before updating the timing file's source hash.

With Playwright available, validate with:

```sh
node tests/kena_audio.cjs
```

The test checks all 36 sections, declared recitation-form changes, matching Sanskrit/IAST pause markers, all 34 audited pada sequences, both invocation word studies, embedded-audio identity, the playback speed range, verse stopping, repeat, continuation, navigation, mobile layouts, and playback with external requests blocked.
