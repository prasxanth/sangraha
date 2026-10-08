# Kena illustrated electric-blue edition

The reader has 34 individually numbered cards and corresponding study views, following this study edition’s existing numbering (8, 5, 12 and 9 readings in its four khaṇḍas). Previously grouped passages are separated using the existing Sanskrit, transliteration and word notes. This change preserves the edition’s numbering; it is not a correction to a canonical Sanskrit edition. See [content provenance](kena-individual-mantras.md) for excerpt, editorial and shared-commentary details.

## Artwork

Each reading has a distinct contextual illustration regenerated specifically as a wide 3:1 composition using the built-in imagegen tool. The full scene spans the card width without cropping or stretching. Figures and important objects fit within the frame; quiet foreground and a dark title area keep the caption away from the subject. Current prompts are in [kena-wide-artwork-prompts.json](kena-wide-artwork-prompts.json), and asset dimensions are recorded in [kena-wide-artwork-manifest.json](kena-wide-artwork-manifest.json). Original portrait assets and their [prompts](kena-artwork-prompts.json) remain available for comparison. Images are artistic interpretations, not historical reproductions.

| Reading | Asset under `assets/kena/` | Subject |
| --- | --- | --- |
| 1.1 | `source-wide.webp` | The Opening Question |
| 1.2 | `senses-wide.webp` | The Ear of the Ear |
| 1.3 | `beyond-wide.webp` | Beyond Sight, Speech and Mind |
| 1.4 | `unknown-wide.webp` | Beyond the Known and Unknown |
| 1.5 | `paradoxes-wide.webp` | Known by Not-Knowing |
| 1.6 | `awareness-each-wide.webp` | Known in Every Cognition |
| 1.7 | `here-now-wide.webp` | Realization Here and Now |
| 1.8 | `all-beings-wide.webp` | Discerning in All Beings |
| 2.1 | `uncertainty-wide.webp` | Neither Certainty nor Ignorance |
| 2.2 | `ungrasped-wide.webp` | The Paradox Restated |
| 2.3 | `lightning-wide.webp` | A Flash of Recognition |
| 2.4 | `intention-wide.webp` | The Mind Returns |
| 2.5 | `delight-wide.webp` | Tad Vana — The Delight of That |
| 3.1 | `victory-wide.webp` | Whose Victory? |
| 3.2 | `yaksha-wide.webp` | The Mysterious Presence |
| 3.3 | `agni-identity-wide.webp` | Agni Declares His Identity |
| 3.4 | `grass-wide.webp` | The Grass Agni Cannot Burn |
| 3.5 | `fire-return-wide.webp` | Agni Returns Without an Answer |
| 3.6 | `vayu-boast-wide.webp` | Vāyu Declares His Power |
| 3.7 | `wind-wide.webp` | The Grass Vāyu Cannot Move |
| 3.8 | `wind-return-wide.webp` | Vāyu Returns; Indra Approaches |
| 3.9 | `uma-encounter-wide.webp` | Indra Encounters Umā |
| 3.10 | `uma-wide.webp` | It Was Brahman |
| 3.11 | `indra-grace-wide.webp` | Indra Receives the Recognition |
| 3.12 | `proximity-wide.webp` | Those Who Came Closest |
| 4.1 | `nearness-wide.webp` | Agni, Vāyu and Indra |
| 4.2 | `indra-recognition-wide.webp` | Indra’s Nearness |
| 4.3 | `first-knower-wide.webp` | The First Recognition |
| 4.4 | `brief-flash-wide.webp` | The Lightning Analogy |
| 4.5 | `returning-mind-wide.webp` | Repeated Remembrance |
| 4.6 | `teaching-given-wide.webp` | The Teaching Has Been Given |
| 4.7 | `foundation-wide.webp` | The Threefold Foundation |
| 4.8 | `truth-home-wide.webp` | Truth Is Its Home |
| 4.9 | `established-wide.webp` | Firmly Established |

The full-resolution illustrations are encoded as WebP at quality 90 and are also embedded in `kena_upanishad.html`, so artwork travels with the HTML file. Existing external font loading is unchanged. The reader uses `width:100%; height:auto` to display the entire wide illustration at its natural aspect ratio. A dark extension of the artwork area accommodates the title without covering the scene. Homepage and chapter images also retain their natural proportions. On short landscape screens, the card scrolls to preserve the complete image and readable passage; navigation remains at the bottom of the viewport. Changing readings returns the card to its top.

## Reading and navigation

The clickable logo and title open a homepage with Read, Overview, Khaṇḍas and Index links at the bottom. No persistent bottom navigation consumes the reading viewport. The card fills the available height below the header, with previous/next buttons and a passage picker immediately above a 12px bottom gutter. The redundant heading, edition label and reading-count line are removed. Cards retain 8px corners; controls use 5px corners.

Sanskrit is on the front and English on the back. New card selections open in Sanskrit. “Study this passage” opens only the selected numbered reading. The Index and Khaṇḍas also link directly to individual studies. Readings 1.5–1.8 remain adjacent under “From the paradox of knowing to realization.” “Back to card” preserves the selected card, language face and reading position. Desktop and mobile stack the full-width image above independently scrolling text. The previous/next and passage-picker controls remain visible on short screens; the card itself can scroll to its language and study buttons. Arrow keys work when the reading passage has focus.

The original pre-redesign backup is `archive/kena_upanishad.pre-electric-blue-2026-09-30.html`. The preceding geometric design is preserved as `archive/kena_upanishad.pre-illustrated-cards-2026-09-30.html`. The version immediately before separating the grouped passages is preserved byte-for-byte in `archive/kena_upanishad.pre-individual-mantras-2026-10-03.html`. The version before this wide-artwork correction is saved in `archive/kena_upanishad.pre-wide-art-2026-10-03.html`. Later published versions are preserved in Git history.

## Icon, gestures and word study

The header and browser icon use the same original vector symbol, [`assets/kena/awareness-mark.svg`](../assets/kena/awareness-mark.svg): an eye with a luminous point within it, inspired by the passage “eye of the eye.” This code-native SVG is embedded in the header and icon links and needs no image-generation service.

A rightward touch swipe advances to the next card; a leftward swipe returns to the previous card. The gesture rejects vertical movement, multi-touch, long presses, text selections and drags beginning on controls. Native vertical scrolling and pinch zoom remain available. Swipes stop at the first and last cards.

In “Study this passage,” the word-by-word tables become flowing pada-viccheda sections, pairing Sanskrit terms with their IAST. Each displayed word can open a native modal dialog containing the existing Sanskrit/IAST entry and its complete meaning. Phrase-level entries retain their shared explanation, and sandhi differences between the two scripts are preserved rather than mechanically realigned. Escape, the Close button or the backdrop dismiss the popup and return focus to its word. Continuous Sanskrit and IAST come from the prior page. Existing notes are assigned to their relevant readings; wider commentary has visible scope labels, while the word study follows every occurrence in the selected verse. New study focuses and adapted English summaries are labelled editorial. The individual chapter study source tables provide the data for the interactive word presentation.

## Validation

`NODE_PATH=/path/to/node_modules node tests/kena_upanishad.cjs` uses Playwright to check all 34 unique artworks, image decoding, native 3:1 proportions and full-width uncropped rendering, Sanskrit-first cards, language switching, isolated study content, return state, homepage links, brand navigation, keyboard navigation, corner radius, individual chapter/index routes, the 34-entry index, separation of 1.5–1.8, labelled shared material, viewport fit at desktop, phone and landscape sizes, real right/left touch gestures, vertical scrolling, preserved word meanings and both Sanskrit/IAST popup triggers. Chrome defaults to its macOS application path; set `CHROME_PATH` to override it.
