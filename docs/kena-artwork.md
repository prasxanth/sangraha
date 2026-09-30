# Kena illustrated electric-blue edition

The reader uses thirteen cards matching the original document's thirteen study passages, including its grouped mantra ranges. It retains all Sanskrit, transliteration, English translations, prose explanations, word tables, and commentary. The index still contains 34 entries. The cards copy the existing reading text; they do not generate new translations.

Four illustrations were created with the built-in imagegen tool. The complete final prompts are in [kena-artwork-prompts.json](kena-artwork-prompts.json). The illustrations are artistic interpretations of the passages, not historical reproductions.

| Asset | Reading cards | Connection |
| --- | --- | --- |
| `assets/kena/source.webp` | Khaṇḍa I, 2.1–2.2, 4.7–4.9 | The seeker and reflected sky evoke inquiry into the source of awareness and contemplative discipline. |
| `assets/kena/lightning.webp` | 2.3–2.5, 4.4–4.6 | The passages explicitly invoke the flash of lightning and recognition. |
| `assets/kena/grass.webp` | 3.1–3.4, 3.5–3.8 | The blade of grass that Agni cannot burn and Vāyu cannot move. |
| `assets/kena/uma.webp` | 3.9–3.12, 4.1–4.3 | Umā's revelation to Indra and the significance of his receiving instruction. |

All four images retain their generated 1024 × 1536 resolution, encoded as WebP at quality 90. They are also embedded in `kena_upanishad.html`, so the artwork travels with the HTML file. The existing external font stylesheet is unchanged.

The main reading view has an illustrated card with an 8px corner radius, a passage picker, previous/next buttons, Sanskrit on the front, English on the back, and a dedicated study view for the selected passage. New card selections open in Sanskrit. “Back to card” preserves the selected card, language face, and reading position. Each study view contains only the selected original passage (including existing grouped verse ranges), with its full study material. Controls use a 5px radius. Mobile stacks artwork over text; desktop places them side by side. Arrow keys work when the reading passage has focus.

The original pre-redesign backup is `archive/kena_upanishad.pre-electric-blue-2026-09-30.html`. The preceding electric-blue-on-black design is preserved separately as `archive/kena_upanishad.pre-illustrated-cards-2026-09-30.html`.

Validation: `NODE_PATH=/path/to/node_modules node tests/kena_upanishad.cjs` uses Playwright to check all thirteen readings, image decoding, language switching, study links, keyboard navigation, corner radius, the index, and desktop/mobile layouts. Chrome defaults to the macOS application path; `CHROME_PATH` can override it.
