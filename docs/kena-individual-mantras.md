# Current edition: source-audited 8 October 2026

The reader now contains 34 complete source-checked mantras and 601 word occurrences. See [the complete audit and verse cross-reference](kena-source-audit.md) and [the current content manifest](kena-individual-mantras.json). The numbering, excerpts and inherited attributions described below were superseded after errors were found. The following is retained only as a record of earlier layout work; it is not authority for the Sanskrit.

---

# Individual Kena readings: content provenance

The pre-change page is preserved byte-for-byte at `archive/kena_upanishad.pre-individual-mantras-2026-10-03.html`. Its thirteen grouped reading units are now 34 separately numbered cards and study views. The order and numbering follow this study edition, not a newly established canonical text. [The content manifest](kena-individual-mantras.json) records each reading’s text, original group, artwork, thematic section, excerpt status and shared word-study scope.

## Separating the passages

- **1.1–1.4:** existing study bodies retained.
- **1.5–1.8:** split at the existing Sanskrit and IAST boundaries, with their already separate word notes. The four readings share the section label “From the paradox of knowing to realization.” The former combined explanation for 1.7–1.8 remains visibly labelled as shared commentary.
- **2.1–2.5:** split using the existing paragraphs and individual word tables. Commentary is assigned to the relevant reading or labelled with its broader scope.
- **3.1–3.12:** retain the Sanskrit excerpts supplied by the earlier page and label them as excerpts. For 3.2, 3.3, 3.5 and 3.8, the earlier page supplied an index excerpt without an individual word table. The October 7 word-coverage correction replaces those borrowed lists with complete notes for each displayed excerpt. Other prose passages use the relevant existing lines and glossary rows; 3.7 combines the existing grass-placement line with the existing wind-test line. New editorial study focuses and contemplation prompts fill gaps.
- **4.1–4.9:** split the existing grouped source paragraphs and word tables. The earlier index summaries for 4.1–4.5 did not consistently match the detailed study text; index entries and cards now follow the detailed study. Newly adapted English summaries are labelled editorial. The original combined translations and broader explanations remain labelled as shared where necessary.

## Visible scope labels

“Study focus · editorial” distinguishes added guidance from inherited attributed commentary. “Shared commentary” identifies explanations that cover more than the current reading. All 34 readings now have occurrence-by-occurrence word study. Phrase-level explanations are retained and identified as phrase notes when a phrase is split into separate Sanskrit/IAST pairs. Sanskrit excerpt labels appear on both the reader and the corresponding study material.

Existing attributed explanations remain part of this edition; their textual accuracy and attribution have not been independently audited as part of this layout and passage-separation change. No missing Sanskrit was newly composed. Each view includes study guidance, word meanings and a contemplation anchor, while making inherited excerpt and shared-material limitations visible.

## Complete pada-viccheda audit — October 7, 2026

The 34 word lists now contain 394 ordered occurrences, including repeated words. The original Sanskrit, continuous IAST, translations, commentary, study focuses and illustrations were preserved and compared against the pre-edit backup. Only word-study tables and four obsolete shared-word-list metadata fields changed.

- 1.6 restores both missing occurrences of **विन्दते** (three total); 1.7 restores the second **इह अवेदीत्**.
- 2.5 restores the second **तद्वनम्**; 3.4 restores the second **इति**; 3.6 restores **वा अहम् अस्मि** after **मातरिश्वा**.
- 3.2, 3.3, 3.5 and 3.8 now analyze their own displayed excerpts instead of borrowing a neighbouring glossary. The two partial tables in 3.7 are combined in verse order.
- Sandhi-hidden constituents are represented individually in both scripts. The lightning/blink passages include the connecting **इद्** and both **आ इति** occurrences. In 2.4/4.5, **उपस्मरति** follows the displayed Sanskrit’s singular form, rather than the older glossary’s plural **उपस्मरन्ति**.
- Existing phrase explanations remain available in the word popups, with a “Phrase note” label. Continuous-text spellings and the edition’s numbering have not been silently normalized. In particular, 2.5’s inherited **तद्धा** is reflected by **तत् हा** with an explanatory note; common editions read **तद्ध**. The continuous IAST also retains inherited inconsistencies; separated IAST now directly matches the displayed pada-viccheda Sanskrit.

Sandhi and missing short glosses were checked against the [Kena text and commentary presented by A. K. Aruna](https://www.upasanayoga.org/KenU.htm), especially the split forms for the two analogies, recollection, and the Yakṣa dialogue. Added glosses are concise editorial explanations, not quotations attributed to the inherited translators.

[The regression fixture](../tests/fixtures/kena_pada_sequences.json) records every Sanskrit/IAST occurrence and its source verse. Browser checks compare all 34 rendered sequences with the reviewed fixture and open every word’s popup in both scripts. Explicit checks lock the repeated words in 1.6, 1.7, 1.8, 2.5, 3.4, 3.6 and 4.9.
