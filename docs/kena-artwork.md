# Kena illustrated electric-blue edition

The reader uses thirteen cards matching the original document's thirteen study passages, including its grouped mantra ranges. All original Sanskrit, transliteration, English translations, prose explanations, word tables, and commentary are retained. The index still contains 34 entries. Cards use the existing text without generating new translations.

## Artwork

Each reading has its own distinct contextual illustration. All thirteen were created using the built-in imagegen tool. Complete final prompts are in [kena-artwork-prompts.json](kena-artwork-prompts.json). The images are artistic interpretations of the passages, not historical reproductions. The initial four illustrations remain assigned to one reading each; nine new illustrations remove the previous reuse across cards.

| Reading | Asset under `assets/kena/` | Connection |
| --- | --- | --- |
| 1.1 | `source.webp` | A seeker contemplating the source of awareness beside a reflecting lake. |
| 1.2 | `senses.webp` | Mirror, conch and flute illuminated by one lamp: awareness behind the instruments of perception. |
| 1.3 | `beyond.webp` | A doorway opening into mystery beyond the reach of sight, speech and mind. |
| 1.4 | `unknown.webp` | Teacher and student, empty hands and a veiled moon: beyond the known and unknown. |
| 1.5–1.8 | `paradoxes.webp` | A reflection of stars rather than a face: relinquishing the grasp on the knower. |
| 2.1–2.2 | `uncertainty.webp` | A student setting a manuscript aside in humble inquiry rather than claiming certainty. |
| 2.3–2.5 | `lightning.webp` | The flash of lightning as an image of recognition. |
| 3.1–3.4 | `grass.webp` | The blade of grass that Agni cannot burn. |
| 3.5–3.8 | `wind.webp` | Vāyu's vortex cannot move a single blade of grass. |
| 3.9–3.12 | `uma.webp` | Umā reveals the truth to Indra. |
| 4.1–4.3 | `proximity.webp` | Indra nearest the radiance, followed by Vāyu and Agni: proximity and receptivity. |
| 4.4–4.6 | `intention.webp` | Returning light on a river: the mind repeatedly remembering awareness. |
| 4.7–4.9 | `foundation.webp` | A sanctuary on three foundations: austerity, restraint and right action, with truth as its home. |

The full-resolution illustrations are encoded as WebP at quality 90 and are also embedded in `kena_upanishad.html`, so artwork travels with the HTML file. Existing external font loading is unchanged. The reader contains the full portrait image without cropping; its title is overlaid near the bottom. The homepage uses the opening illustration as a cropped welcome image. Chapter study headers retain representative images.

## Reading and navigation

The clickable logo and title open a homepage with Read, Overview, Khaṇḍas and Index links at the bottom. No persistent bottom navigation consumes the reading viewport. The card fills the available height below the header, with previous/next buttons and a passage picker immediately above a 12px bottom gutter. The redundant heading, edition label and reading-count line are removed. Cards retain 8px corners; controls use 5px corners.

Sanskrit is on the front and English on the back. New card selections open in Sanskrit. “Study this passage” opens only that passage's original study material, retaining grouped verse ranges. “Back to card” preserves the selected card, language face and reading position. Desktop uses image and passage side by side; mobile stacks the image above independently scrolling text. The card controls remain visible on short screens. Arrow keys work when the reading passage has focus.

The original pre-redesign backup is `archive/kena_upanishad.pre-electric-blue-2026-09-30.html`. The preceding geometric design is preserved as `archive/kena_upanishad.pre-illustrated-cards-2026-09-30.html`. Later published versions are preserved in Git history.

## Validation

`NODE_PATH=/path/to/node_modules node tests/kena_upanishad.cjs` uses Playwright to check all thirteen unique artworks, image decoding, Sanskrit-first cards, language switching, isolated study content, return state, homepage links, brand navigation, keyboard navigation, corner radius, the 34-entry index, and viewport fit at desktop, phone and landscape sizes. Chrome defaults to its macOS application path; set `CHROME_PATH` to override it.
