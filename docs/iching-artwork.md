# I Ching copper edition

The original page is preserved byte for byte in `archive/iching_oracle.pre-copper-2026-09-28.html`.

`iching_oracle.html` contains 64 individually generated copper-and-black illustrations, one for each hexagram. Each prompt uses that card's Image and attributes, with more specific subjects for distinctive passages: the dragon, mare, tiger, bowed ridgepole, dry lake, well, cauldron, and crossing fox. The illustrations are editorial interpretations of the supplied text, not historical reproductions.

## Artwork and prompts

Generated using the built-in imagegen tool. The complete final prompt set and intended contextual descriptions are in [iching-artwork-prompts.json](iching-artwork-prompts.json), indexed by hexagram number and name. Final images are embedded as WebP data URLs in the HTML's `ARTWORK` array in the same 1–64 order. They retain their generated resolution, with no artificial enlargement or color filters. The page requires no external image assets, fonts, or network requests.

The welcome card uses hexagram 1 (The Creative). The casting panel uses hexagram 24 (Return), whose new shoot suggests the start of a cycle. Reading, library, and relating-hexagram cards use the illustration assigned to the actual hexagram; artwork is never selected randomly or by number modulo a theme count.

## Presentation

The Tao Te Ching reader informs the dark lacquer backgrounds, metallic borders, serif text, illustrated headers, and reading-card hierarchy. Copper replaces gold throughout. Cast, Reading, and All 64 are the primary destinations, with navigation above the content on desktop and below it on mobile. The brand returns to the welcome card; the method guide is available in the header.

The library shows one card at a time, with previous/next buttons, horizontal swipes, arrow keys, and a searchable 64-hexagram picker. Its passage scrolls independently, with a continuation control when text remains below. Consultations scroll naturally so the question, primary hexagram, moving-line reflections, and relating hexagram stay together. No language-flip control is provided because this source contains Chinese names rather than complete Chinese passages.

All original hexagram records and the trigram lookup are retained. Moving-line text remains general reflection guidance and is labeled accordingly. Tests cover preserved source text, unique decodable artwork, trigram mappings, changing and unchanging casts, escaped questions, picker and dialog behavior, keyboard and swipe navigation, responsive layouts, and offline operation.

Run `NODE_PATH=/path/to/node_modules node tests/iching_oracle.cjs` with Playwright installed. Chrome defaults to the macOS application path; set `CHROME_PATH` to override it.
