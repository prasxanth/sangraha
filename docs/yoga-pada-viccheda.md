# Yoga study word meanings

The study view covers all Sanskrit passages featured on the 27 reading cards: 78 sūtras and 542 lexical entries before adding existing commentary terms. Sanskrit and IAST controls open the same accessible meaning dialog, following `kena_upanishad.html`.

`assets/yoga/pada-viccheda.js` records the featured references and reviewed word groups. Each sūtra includes its source URL and source edition reference. Compounds are separated into meaningful components; this is a reading aid rather than a full grammatical analysis. Sandhi is undone where needed, so standalone forms can differ from the joined verse.

Additional glosses are adapted from Rama Prasada’s **Yoga-Sutras with the commentaries of Vyasa and Vachaspati Misra**, 1924 (public domain), [transcribed by Wisdom Library](https://www.wisdomlib.org/hinduism/book/yoga-sutras-with-commentaries). OCR errors and omitted words were corrected against the local Sanskrit; some wording was simplified. The source’s chapter-three numbering differs from the local edition after 3.19; `sourceReference` records that distinction. The combined source entry 3.26–3.30 supplies the local 3.27–3.31. The local 3.20 is supplied separately from its Sanskrit and translation, with the related source discussion linked.

Existing Yoga Sudhākara word meanings take precedence when the same Sanskrit or IAST term appears in the current lesson. Remaining original glossary entries appear as commentary word meanings. Comparison tables, verses, translations, and explanations remain intact. No lookup service or network request is required to open a meaning.

Validation: `NODE_PATH=/path/to/playwright/node_modules node tests/yoga_sudhakara.cjs`. Set `CHROME_PATH` if Chrome is installed outside the default macOS location.
