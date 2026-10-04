# Kena illustrated electric-blue edition

The reader has 34 individually numbered cards and corresponding study views, following this study edition’s existing numbering (8, 5, 12 and 9 readings in its four khaṇḍas). Previously grouped passages are separated using the existing Sanskrit, transliteration and word notes. This change preserves the edition’s numbering; it is not a correction to a canonical Sanskrit edition. See [content provenance](kena-individual-mantras.md) for excerpt, editorial and shared-commentary details.

## Artwork

Each reading has its own distinct contextual illustration. All 34 were created using the built-in imagegen tool: thirteen existing illustrations are retained and 21 new illustrations accompany the separated readings. Complete final prompts are in [kena-artwork-prompts.json](kena-artwork-prompts.json). Images are artistic interpretations, not historical reproductions.

| Reading | Asset under `assets/kena/` | Subject |
| --- | --- | --- |
| 1.1 | `source.webp` | The Opening Question |
| 1.2 | `senses.webp` | The Ear of the Ear |
| 1.3 | `beyond.webp` | Beyond Sight, Speech and Mind |
| 1.4 | `unknown.webp` | Beyond the Known and Unknown |
| 1.5 | `paradoxes.webp` | Known by Not-Knowing |
| 1.6 | `awareness-each.webp` | Known in Every Cognition |
| 1.7 | `here-now.webp` | Realization Here and Now |
| 1.8 | `all-beings.webp` | Discerning in All Beings |
| 2.1 | `uncertainty.webp` | Neither Certainty nor Ignorance |
| 2.2 | `ungrasped.webp` | The Paradox Restated |
| 2.3 | `lightning.webp` | A Flash of Recognition |
| 2.4 | `intention.webp` | The Mind Returns |
| 2.5 | `delight.webp` | Tad Vana — The Delight of That |
| 3.1 | `victory.webp` | Whose Victory? |
| 3.2 | `yaksha.webp` | The Mysterious Presence |
| 3.3 | `agni-identity.webp` | Agni Declares His Identity |
| 3.4 | `grass.webp` | The Grass Agni Cannot Burn |
| 3.5 | `fire-return.webp` | Agni Returns Without an Answer |
| 3.6 | `vayu-boast.webp` | Vāyu Declares His Power |
| 3.7 | `wind.webp` | The Grass Vāyu Cannot Move |
| 3.8 | `wind-return.webp` | Vāyu Returns; Indra Approaches |
| 3.9 | `uma-encounter.webp` | Indra Encounters Umā |
| 3.10 | `uma.webp` | It Was Brahman |
| 3.11 | `indra-grace.webp` | Indra Receives the Recognition |
| 3.12 | `proximity.webp` | Those Who Came Closest |
| 4.1 | `nearness.webp` | Agni, Vāyu and Indra |
| 4.2 | `indra-recognition.webp` | Indra’s Nearness |
| 4.3 | `first-knower.webp` | The First Recognition |
| 4.4 | `brief-flash.webp` | The Lightning Analogy |
| 4.5 | `returning-mind.webp` | Repeated Remembrance |
| 4.6 | `teaching-given.webp` | The Teaching Has Been Given |
| 4.7 | `foundation.webp` | The Threefold Foundation |
| 4.8 | `truth-home.webp` | Truth Is Its Home |
| 4.9 | `established.webp` | Firmly Established |

The full-resolution illustrations are encoded as WebP at quality 90 and are also embedded in `kena_upanishad.html`, so artwork travels with the HTML file. Existing external font loading is unchanged. The reader crops each portrait illustration to fill a full-width banner at the top of the card; its title is overlaid near the bottom. The homepage uses the opening illustration as a cropped welcome image. Chapter study headers retain representative images.

## Reading and navigation

The clickable logo and title open a homepage with Read, Overview, Khaṇḍas and Index links at the bottom. No persistent bottom navigation consumes the reading viewport. The card fills the available height below the header, with previous/next buttons and a passage picker immediately above a 12px bottom gutter. The redundant heading, edition label and reading-count line are removed. Cards retain 8px corners; controls use 5px corners.

Sanskrit is on the front and English on the back. New card selections open in Sanskrit. “Study this passage” opens only the selected numbered reading. The Index and Khaṇḍas also link directly to individual studies. Readings 1.5–1.8 remain adjacent under “From the paradox of knowing to realization.” “Back to card” preserves the selected card, language face and reading position. Desktop and mobile stack the full-width image above independently scrolling text. The card controls remain visible on short screens. Arrow keys work when the reading passage has focus.

The original pre-redesign backup is `archive/kena_upanishad.pre-electric-blue-2026-09-30.html`. The preceding geometric design is preserved as `archive/kena_upanishad.pre-illustrated-cards-2026-09-30.html`. The version immediately before separating the grouped passages is preserved byte-for-byte in `archive/kena_upanishad.pre-individual-mantras-2026-10-03.html`. Later published versions are preserved in Git history.

## Icon, gestures and word study

The header and browser icon use the same original vector symbol, [`assets/kena/awareness-mark.svg`](../assets/kena/awareness-mark.svg): an eye with a luminous point within it, inspired by the passage “eye of the eye.” This code-native SVG is embedded in the header and icon links and needs no image-generation service.

A rightward touch swipe advances to the next card; a leftward swipe returns to the previous card. The gesture rejects vertical movement, multi-touch, long presses, text selections and drags beginning on controls. Native vertical scrolling and pinch zoom remain available. Swipes stop at the first and last cards.

In “Study this passage,” the word-by-word tables become flowing pada-viccheda sections, pairing Sanskrit terms with their IAST. Each displayed word can open a native modal dialog containing the existing Sanskrit/IAST entry and its complete meaning. Phrase-level entries retain their shared explanation, and sandhi differences between the two scripts are preserved rather than mechanically realigned. Escape, the Close button or the backdrop dismiss the popup and return focus to its word. Continuous Sanskrit and IAST come from the prior page. Existing notes are assigned to their relevant readings; wider commentary and reused word study have visible scope labels. New study focuses and adapted English summaries are labelled editorial. The individual chapter study source tables provide the data for the interactive word presentation.

## Validation

`NODE_PATH=/path/to/node_modules node tests/kena_upanishad.cjs` uses Playwright to check all 34 unique artworks, image decoding, Sanskrit-first cards, language switching, isolated study content, return state, homepage links, brand navigation, keyboard navigation, corner radius, individual chapter/index routes, the 34-entry index, separation of 1.5–1.8, labelled shared material, viewport fit at desktop, phone and landscape sizes, real right/left touch gestures, vertical scrolling, preserved word meanings and both Sanskrit/IAST popup triggers. Chrome defaults to its macOS application path; set `CHROME_PATH` to override it.
