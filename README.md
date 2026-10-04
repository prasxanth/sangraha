# Sangraha

> *saṃgraha* (संग्रह) — Sanskrit for *compendium*, a curated gathering of knowledge and practice.

A collection of personal single-file web apps — project management, metabolic tracking, Vedic astrology timing, Vedic sādhana, Upaniṣadic study and memorization, Yoga, a reading library, I Ching divination, and health recipes — each designed to live on an iPhone home screen.

---

## Contents

- [Overview](#overview)
- [Apps](#apps)
  - [Project Dashboard](#project-dashboard)
  - [Gantt Planner](#gantt-planner)
  - [Agni](#agni)
  - [Astrology Engine](#astrology-engine)
  - [Jyotish Sādhana](#jyotish-sādhana)
  - [Kena Upaniṣad](#kena-upaniṣad)
  - [Kena Game](#kena-game)
  - [Yoga Sudhakara](#yoga-sudhakara)
  - [Marginalia](#marginalia)
    - [Books Toolchain](#books-toolchain)
  - [I Ching Oracle](#i-ching-oracle)
  - [Tao Te Ching](#tao-te-ching)
  - [Recipes](#recipes)
- [iOS Home Screen Icons](#ios-home-screen-icons)
- [Technical Notes](#technical-notes)

---

## Overview

This repository contains a suite of personal knowledge and practice tools. Each app is a single self-contained HTML file: no server, no build step, no dependencies to install. Open any file directly in a browser, or — on iOS — use Safari's **Add to Home Screen** to install it as a standalone app with its own icon, title, and full-screen launch. All apps work fully offline.

The eleven apps cover: a full-featured project and milestone tracker (**Project Dashboard**), a swim-lane Gantt chart with critical-path and dependency tracking (**Gantt Planner**), a metabolic health protocol system driven by blood lab data (**Agni**), a birth-driven Vedic/Western/Saju timing engine with heatmaps and natal rankings (**Astrology Engine**), a Vedic astrology daily spiritual practice (**Jyotish Sādhana**), a verse-by-verse study companion for the Kena Upaniṣad (**Kena Upaniṣad**), an interactive memorization game for the same text (**Kena Game**), a Yoga Sūtra learning course (**Yoga Sudhakara**), a personal reading library with thematic browsing and stats (**Marginalia**), a classical I Ching divination oracle (**I Ching Oracle**), and a health-protocol recipe reference with daily checklist (**Recipes**). The project management apps and the books app each live in their own subfolder; all others are single root-level files. The books app is backed by a CSV database that can be updated via a small Python script.

---

## Apps

> Both project-management apps live in `planning/`.

### Project Dashboard

**File:** `planning/project_dashboard.html`

A full-featured personal project and milestone tracker. All data — projects, milestones, tasks, settings — is stored in `localStorage` and fully exportable/importable as a single JSON file, enabling exact state round-trips across devices or sessions.

**Key sections:**

- **Sidebar (Projects panel):** Collapsible and resizable left panel listing all projects. Each project shows its status badges (Active, Critical, custom tags), a task count, and artefact links. Projects can be filtered by tag and reordered via drag-and-drop.
- **Milestone table:** Per-project milestone tracking with configurable visible columns (Name, Status, Due Date, Owner, Artefacts, Notes, Progress). Columns are resizable with pixel-precise drag handles; a "Restore defaults" option resets widths. Column visibility and widths persist across sessions.
- **Tasks panel:** Expandable per-milestone task list. Each task has a name, due date, owner, status, progress (%), and a notes field. Tasks can be reordered via drag-and-drop within a milestone.
- **Tag filtering:** Projects can carry custom tags alongside the built-in Active/Critical badges. The tag filter bar above the dashboard filters projects in real time.
- **Editable title:** The dashboard title ("PROJECT DASHBOARD" by default) is inline-editable and persists to `localStorage`.
- **Export / Import:** Full state export to a timestamped JSON file (`project-dashboard-YYYYMMDDHHMMSS.json`) covering all project data, ordering, sidebar width/collapse state, and column configuration. Import recreates the exact exported state.

**Data model:**
```
DB = {
  projects: [
    {
      id, name, status, tags[],
      milestones: [
        {
          id, name, status, due, owner, progress, notes,
          artefacts: [{label, url}],
          tasks: [{id, name, due, owner, status, progress, notes}]
        }
      ]
    }
  ]
}
```

**Drag-and-drop reordering:** All three levels — projects in the sidebar, milestones within a project, and tasks within a milestone — support mouse and touch drag-and-drop. Order is saved immediately on every drop.

**How to use:** Open `planning/project_dashboard.html` in any browser. Use the **＋ Project** button to add a project, then add milestones and tasks within each project. Export regularly to back up state.

---

### Gantt Planner

**File:** `planning/gantt_planner.html`

A full-featured interactive Gantt chart app for planning and tracking projects on a visual timeline. All data is stored in `localStorage` and fully exportable/importable as JSON or Mermaid markdown.

**Key features:**

- **Swim lanes:** Color-coded horizontal lanes (e.g., Planning, Design, Development, Testing, Launch), each with an optional Critical flag.
- **Task groups:** Optional named groups that nest tasks within a lane — shown as collapsible indented rows.
- **Tasks:** Each task carries a name, start date, end date, owner, progress (0–100%), color label(s), finish-to-start dependencies, optional milestone flag, and a per-task critical override.
- **Critical path:** Toggle (⚡) highlights the longest dependency chain end-to-end; sidebar stat shows total critical-path task count.
- **Dependency arrows:** Toggle (🔗) renders visual connector lines between dependent tasks on the canvas.
- **Zoom levels:** Day · Week · Month · Quarter — switch on the fly to see a sprint or a full roadmap.
- **Today line:** Toggle (📅) draws a vertical marker for the current date.
- **Lock / Unlock:** 🔒 Locked mode prevents accidental edits; ✏ Editing mode enables all interactions.
- **Filters:** Filter tasks by label or owner; active filters shown as chips; one-click clear.
- **Holiday manager:** Built-in default public holiday set; add or remove dates via the duration popover.
- **Column visibility & resizing:** Sidebar columns (Name, Start, End, Duration, Owner, Progress, Labels, Deps) are independently show/hide and pixel-precise drag-resizable; widths persist.
- **Export:** JSON (full state round-trip) · Mermaid `.md` (Gantt diagram for docs).
- **Import:** Load a previously exported JSON to restore an exact session.
- **Editable title:** Project name in the top bar is inline-editable and persisted.
- **Sample project:** Ships with a "Product Launch 2025" dataset (5 lanes, 15 tasks, milestones, deps) to explore all features immediately.

**Data model:**
```
{
  title: string,
  swimLanes: [{ id, name, color, isCritical }],
  taskGroups: [{ id, laneId, name, isCritical }],
  labels: [{ id, name, color }],
  tasks: [{ id, lane, groupId, labels[], name, start, end, owner,
             notes, deps[], isMilestone, progress, color, isCritical }]
}
```

**How to use:** Open `planning/gantt_planner.html` in any browser. The sample project loads automatically on first run. Use the toolbar to add swim lanes and tasks, or **Import** a saved JSON.

---

### Agni

**File:** `agni.html`

A lab-directed metabolic protocol system built on the principle: *each lab result activates a protocol.* Agni tracks blood panel results from Function Health / Quest Diagnostics, maps failing biomarker gates to the appropriate intervention protocol, and provides the full daily plan for that protocol.

**Key sections:**

- **Timeline (Home):** Chronological lab entries showing panel date, source, key cardiometabolic markers (ApoB, TG, LDL-P, Ferritin, HDL, hs-CRP), pass/fail gate summary, and a direct link to the activated protocol. Future planned retests appear as pending entries.
- **Labs:** Full detail view for a result set — all gate statuses with current value, target, and delta needed. Shows which protocol was activated and why (e.g., "5 of 8 gates failing → decongestive force protocol").
- **Protocol — SEP Reset · Phase 2:** The active Signal-Explicit Partitioning (SEP) Reset Phase 2 is an 8–12 week intensified clearance + muscle disposal protocol targeting ApoB, HDL, Ferritin, HbA1c, and hs-CRP. Six protocol tabs:
  - **Schedule** — day-by-day (Mon–Sun) plan with iron window (2:30 PM Mon/Wed/Fri/Sun), NAC at 10:30 AM, BALT in afternoon, post-meal walks, and optional Wed niacin
  - **Supps** — 25 supplements with dose, timing, and supply chain notes (Omega-3 increased to 3 g EPA+DHA/day; niacin added as optional pulse)
  - **Gates** — 8 transition gates with current status: TG ✓ · LDL-P ✓ · AST/ALT ✓ passing; ApoB · Ferritin · hs-CRP · HDL · HbA1c still failing
  - **Caveats** — protocol-specific cautions (post-meal walks non-negotiable, conditional dinner berberine, niacin monitoring)
  - **Situations** — conditional adjustments for HIIT, low-carb dinners, niacin flush, and edge-case scenarios
  - **SEP-L** — the next phase; side-by-side comparison of SEP Phase 2 vs. SEP-L (Reversal Phase), which activates only after all 8 gates pass

**Timeline:** December 3, 2025 panel (historical, Phase 1 activated) → **April 24, 2026 panel (active, Phase 2 activated; TG 167 ✓ LDL-P 1299 ✓ new passes)** → follow-up planned ~July–August 2026.

**How to use:** Open `agni.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **Agni**.

---

### Astrology Engine

**Archived file:** [2026-09-22_calibrated_v5.html](archive/astrology_engine/2026-09-22_calibrated_v5.html)

A birth-driven multi-system timing and natal evidence engine that generates a heatmap of life-dimension scores across the full lifespan, drawing from three independent astrological traditions simultaneously. All calculation is client-side — no server, no external API required, though optional Swiss Ephemeris WASM and BaZi library providers can be loaded for higher precision.

**Key tabs:**

- **Heatmap & Actions:** The primary view. After entering a birth profile, the engine scores 12 life dimensions (Career, Wealth, Marriage, Family, Children, Vitality, Mind, Spiritual, Reinvention, Learning, Autonomy, Mentorship) across the entire life timeline and renders a color-coded heatmap. Click any cell for the phase breakdown, quick decision lens (Leverage / Protect), and a full Phase Action Playbook with prioritized recommendations. A cycle-zoom hierarchy lets you drill from Mahadasha → Antardasha → Pratyanatardasha → Sookshma → Prana.
- **Natal Maps & Rankings:** Two natal support matrices — Planet × Life-dimension and House × Life-dimension — calculated from the birth chart and the selected structural evidence layers (D1 through D60). Separate ranked lists for Planet Influence, Planet Benefit/Support, House Salience, and House Benefit/Support.
- **Validation:** A six-chart golden validation suite that tests the internal fallback calculator against known public birth charts. Checks Western Sun/Moon/Asc/MC, Vedic Moon/nakshatra/pada/starting Vimshottari lord, BaZi Four Pillars, and dasha continuity invariants. Results displayed as pass/fail/warn with a banner showing overall status.
- **Integration Guide:** Full plug-in contract with code examples for adding dynamic calculator systems or importing externally generated static timing intervals as JSON. Includes Vimshottari recursion formula, Saju conventions, regression invariants, and handoff rules.

**Calculation systems:**
- **Vedic (Jyotish):** Vimshottari dasha hierarchy recursed to Prana depth using Lahiri/Krishnamurti/Raman/Fagan-Bradley ayanamsa. Natal evidence from D1 plus domain-routed divisional charts (D2–D60) in Integrated mode.
- **Western:** Natal chart plus transits/profections sampled at configurable intervals.
- **Saju (Korean Four Pillars):** Daeun, year, month, and season cycles; direction and start-age follow year-stem polarity and sex, with manual overrides.

**Toolbar controls:** All-life view or time-zoom drill-down (Mahadasha / year / sub-period), system selector, dimension selector (12 dimensions, multi-select), natal evidence layer picker (Integrated / D1-only / D1+primary / Custom), contrast mode (Relative / Absolute / Percentile), CSV export, and profile/config export.

**Profile inputs:** Name, birth date, birth time (to the second), city, country, auto-resolve or manual lat/lon, UTC offset, timezone ID, sex, ayanamsa, house system (Whole Sign / Placidus), birth-time confidence, life horizon (80/100/120 years), Saju Yongsin, Daeun start age, and sampling mode.

**Plug-in architecture:**
- **Dynamic plug-ins:** Register a `calculator(ctx)` function at runtime that receives the birth profile and chart and returns 12 domain scores.
- **Static plug-ins:** Import externally calculated date-interval arrays as JSON with domain scores and a missing-data policy (renormalize or neutral 0).
- Coverage-aware weighting: a system missing a date or domain is automatically renormalized rather than dragging other scores toward zero.

**How to use:** Open the [archived engine](archive/astrology_engine/2026-09-22_calibrated_v5.html) in any browser. Enter birth details and click **Recalculate profile**. On iPhone: Safari → Share → Add to Home Screen → launches as **Astro Engine**.

---

### Jyotish Sādhana

**File:** `jyotish_sadhana.html`

A Jyotish (Vedic astrology) daily spiritual practice companion. The app is organized around the principle of witness-awareness (*sākṣi*) as the primary driver of efficacy, with all rituals — mantra, prāṇāyāma, deity worship — understood as vehicles for recognizing the witness rather than ends in themselves.

**Key sections (six screens via bottom navigation):**

- **Home:** Dashboard with a time-aware greeting, a banner for the currently active session (Morning / Midday / Evening / Night), a grid of four modules, and a daily rhythm strip for quick session navigation.
- **Witnessing:** Core philosophical module. Begins with the Mahāsūtra (*Whatever is seen is not you; the one who sees is you*). Six sub-tabs: Nature, Practice, Experience, Scenarios, Self-check, and Non-dual. Each card is expandable with Sanskrit verses, IAST transliteration, English translation, and calibrated insight notes.
- **Daily Practice:** Four session tabs (Morning, Midday, Evening, Night) with structured step sequences. The Morning sequence (Brahma Muhūrta): Nāḍī Śodhana (3–10 min) → Kena Upaniṣad 1.1–1.2 (×3–5) → Gāyatrī Mantra (×108) → Meditation → Witnessing. Each step is an expandable card with full Sanskrit verse, word-by-word breakdown, and rep count pills.
- **Devatā System:** Personal deity (iṣṭadevatā) system. Iṣṭadevatā is Dakṣiṇāmūrti — Śiva as the silent teacher and witness — with primary mantra (ॐ नमो भगवते दक्षिणामूर्तये), full word-by-word table, and the operational rule: 70% awareness quality dominates 30% ritual correctness.
- **Chart Sutras:** Chart-aligned verse recitation system by session. Anchored in Kena Upaniṣad 1.2, Gāyatrī Mantra, and Bhagavad Gītā 2.48. Includes a five-step daily inner sequence (Awareness → Clarity → Equanimity → Detachment → Stillness) with efficacy percentages.
- **Spiritual Canon:** Age-phased reading curriculum (ages 44–62+) in eight stages: Pātañjala Yoga Sūtrāṇi → Bhagavad Gītā → Kena Upaniṣad → Ātmabodha → Vivekacūḍāmaṇi + Kaṭha Upaniṣad → Aṣṭāvakra Gītā → Māṇḍūkya Upaniṣad → Dakṣiṇāmūrti Stotra + Upadeśa Sāhasrī. Each text has an expandable card with rationale, key sūtras, and an alignment probability bar.
- **Life Field** (from home overflow): Interactive SVG node-map of the spiritual arc across life phases (causal perception 0–30 → timing awareness 30–40 → samyama matures 40–55 → continuous witnessing 55+).

**Sanskrit verses with full word-by-word breakdowns:**
- Kena Upaniṣad 1.1, 1.2, 2.4
- Bhagavad Gītā 2.47, 2.48, 18.61
- Gāyatrī Mantra

**How to use:** Open `jyotish_sadhana.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **Jyotish Sādhana** with a deep amber ॐ icon.

---

### Kena Upaniṣad

**File:** `kena_upanishad.html`

A verse-by-verse study companion for the Kena Upaniṣad (केनोपनिषद्), one of the principal Upaniṣads of the Sāmaveda (Talavakāra Brāhmaṇa). The text opens with the most radical question in philosophy: *By whom directed does the mind fly forth?* — and proceeds through systematic negation to reveal Brahman as the witness behind all instruments of knowing. Each mantra is presented with Sanskrit, IAST transliteration, word-by-word breakdown, English translation, and Śaṅkara commentary.

**Key sections (four screens via bottom navigation):**

- **Home:** App dashboard with the opening verse hero (*केनेषितं पतति प्रेषितं मनः*), quick-access cards for each khaṇḍa, and an overview card.
- **Overview:** Upaniṣad context — structure (verse + prose, two interlocking halves), textual lineage (Sāmaveda · Talavakāra Brāhmaṇa), and study method guide.
- **Khaṇḍas:** All four chapters accessible via tab navigation:
  - **Khaṇḍa I** — *"Eye of the eye, mind of the mind"* — The opening question (By whom?), the Teacher's paradoxical response, systematic negation (Brahman is not known by speech, mind, eye, ear, or breath), and the four paradoxes of knowing by not-knowing (5 mantras, 5 expandable cards).
  - **Khaṇḍa II** — *"न विद्यो न विजानीमः"* — Brahman is not an object of thought; Brahman is apprehended in each flash of cognition as the very ground of cognition (2 mantras).
  - **Khaṇḍa III** — The prose narrative: Brahman wins a victory for the gods; Agni fails, Vāyu fails, Indra approaches — Uma Haimavatī reveals the secret. The story enacts the entire metaphysics of the verse section (3 episodes).
  - **Khaṇḍa IV** — The practical teaching: tapas, dama, and karma as the foundation of Brahman-knowledge; the nature of the knower; the supreme upāsanā (*"all the Vedas as its limbs, truth as its abode"*) (3 mantras).
- **Mantra Index:** All mantras browsable by khaṇḍa, each expandable for full Sanskrit, transliteration, word-by-word table, translation, and commentary.

**How to use:** Open `kena_upanishad.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **Kena Upaniṣad** with a deep violet gradient icon displaying केन.

---

### Kena Game

**File:** `kena_game.html`

An interactive memorization companion for the Kena Upaniṣad — four game modes that drill Sanskrit mantras, their meanings, and the Yakṣa narrative at increasing depth. XP and streak tracking persist across sessions. All content is filterable by khaṇḍa.

**Game modes:**

| Mode | Badge | Description |
|---|---|---|
| **Flashcards** 🃏 | SR | Spaced-repetition cards — Sanskrit on the front, full meaning with word-by-word table on the reverse. Tap to flip. |
| **Fill the Gap** ✍️ | FIB | A mantra is shown with one word blanked out. Select the correct word from a bank of options. |
| **Match Pairs** 🔗 | Pairs | Tap-to-match grid of Sanskrit terms and English meanings. Clear all pairs to complete the round. |
| **Story Order** 📖 | Seq | Arrange the eight episodes of the Yakṣa parable (Khaṇḍas III–IV) in correct narrative sequence. |

**Scoring:**
- Each correct answer earns XP; wrong answers break the streak.
- XP bar shows progress toward the next level (every 200 XP).
- Session summary screen shows XP earned, streak, and correct count.
- Cumulative stats (total sessions, total correct, best streak, total XP) visible on the Home screen.

**Khaṇḍa filter:** Before each game session a picker lets you choose which khaṇḍas to include (I, II, III, IV, or any combination), so you can focus on specific sections of the text.

**How to use:** Open `kena_game.html` in any browser. Select a mode, pick your khaṇḍas, and tap **Start**.

---

### Yoga Sudhakara

**File:** `yoga_sudhakara.html`

A structured learning app for Patañjali's Yoga Sūtras (196 sūtras, 4 chapters) following the *Yoga Sudhākara* commentary by Sadasiva Brahmendra (17th-century Advaita saint), as taught by Swami Paramahamsananda Sarasvatī in the living oral tradition of Parampara Rishividya. The Advaita reading treats Kaivalya as non-different from Brahman-realization rather than the dualistic Puruṣa-isolation of classical Sāṃkhya-Yoga.

**Key sections (four nav items + chapter screens):**

- **Home:** Course dashboard with an "In Progress" banner (Samādhi Pāda — Class 1 active), grid of the four chapters, and quick-access cards for Course Overview and Sūtra Index.
- **Course Overview:** Teacher biography (Swami Paramahamsananda Sarasvatī and the Yoga Sudhākara lineage through Sadasiva Brahmendra), course stats (196 sūtras, 4 chapters, 45 classes), the root text (YS 1.2: *योगश्चित्तवृत्तिनिरोधः*), and a card on what makes the Yoga Sudhākara commentary distinctive.
- **Four chapter screens:**
  - **Samādhi Pāda (Ch. I · 51 sūtras):** Absorption — the gateway sūtras (1.1–1.4), five states of citta, samprajñāta and asamprajñāta samādhi, obstacles, and the path to stillness.
  - **Sādhana Pāda (Ch. II · 55 sūtras):** Practice methods — kleśas, kriyā yoga, aṣṭāṅga yoga (eight limbs), and vivekakhyāti.
  - **Vibhūti Pāda (Ch. III · 56 sūtras):** Saṃyama, dhāraṇā, dhyāna, samādhi, and siddhis arising from concentrated practice.
  - **Kaivalya Pāda (Ch. IV · 34 sūtras):** Liberation — dissolution of the mind, puruṣa, and the nature of Kaivalya.
- **Sūtra Index:** All 196 sūtras browsable by chapter. Each row is expandable for Sanskrit, transliteration, and meaning.

Each sūtra entry has Sanskrit, IAST transliteration, word-by-word table, English translation, and Yoga Sudhākara commentary note.

**How to use:** Open `yoga_sudhakara.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **Yoga Sudhakara**.

---

### Marginalia

**File:** `books/marginalia.html`

A personal reading library browser (~108 books). Book data is embedded as JSON directly in the HTML and rendered entirely client-side. Named for the notes written in the margins of books — reflecting the app's emphasis on personal impact, notes, and re-read intentions rather than mere cataloguing.

**Key sections (two screens via bottom navigation):**

- **Library:**
  - **Search** — full-text across title, author, notes, and themes
  - **Theme filter chips** — dynamically generated for all themes in the library (Human Cognition & Bias, Literature & Human Condition, Science & Epistemology, Business & Management, Speculative Futures & Myth, Power & Institutions, Systems & Complexity, Health & Longevity, Learning & Productivity, Mythology, Mythic Worlds, Humor & Satire, and more). Tapping a chip filters the list; tapping "All" resets.
  - **Sort** — toggle between alphabetical and impact rating (1–5)
  - **Book cards** — spine icon (initials, color-coded by theme), title, author, genre, impact rating. Expanding a card shows: completion date, audiobook status, re-read flag, Fiction/Nonfiction, recommendation status, personal notes, and all theme chips.
  - **Live count** — header and list meta update as filters change
- **Stats:** Total book count, audiobook %, recommend %, fiction vs. nonfiction split, impact rating distribution (bar chart), and book counts by theme (bar chart).

**CSV structure (`books/books_db.csv`):**

| Column | Notes |
|---|---|
| Title | Book title |
| Author | Author name(s) |
| Audiobook | Y / N |
| Completion Date | Free text (e.g., "January, 2020", "Graduate School") |
| Re-read? | Y / N |
| Genre | Free text (e.g., "Psychology / Behavior") |
| Fiction/Nonfiction | Fiction / Nonfiction |
| Impact (1–5) | Numeric rating |
| Would Recommend | Y / N |
| Notes | Personal notes (free text) |
| Themes | Semicolon-delimited (e.g., `Human Cognition & Bias; Learning & Productivity`) |

**How to use:** Open `books/marginalia.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **Marginalia** with a deep blue gradient icon.

#### Books Toolchain

The `books/` directory contains three files that work together:

| File | Role |
|---|---|
| `books_db.csv` | Source of truth — edit this to add, update, or remove books |
| `update_books_navigator_from_csv.py` | Python script that reads the CSV and injects JSON into the HTML |
| `marginalia.html` | The app — reads the embedded JSON at runtime, no server needed |

**Workflow:**

1. Edit `books_db.csv` in any spreadsheet app or text editor. Add a new row per book and use semicolons for multiple themes.
2. Run the updater from the `books/` directory:
   ```bash
   python update_books_navigator_from_csv.py books_db.csv marginalia.html
   ```
3. Open or refresh `marginalia.html` — the new data is live immediately.

**Dependencies:** Python 3, `pandas` (`pip install pandas`).

**Custom paths:** The script accepts optional command-line overrides for both the CSV and HTML paths:
```bash
python update_books_navigator_from_csv.py path/to/books.csv path/to/target.html
```

---

### I Ching Oracle

**File:** `iching_oracle.html`

A copper-and-black illustrated reader for consulting the I Ching using the traditional three-coin method. All 64 hexagram records and 64 individually generated, context-matched illustrations are embedded — no internet connection required.

**Key sections (accessible from the welcome card):**

- **Home:** Illustrated welcome card with Cast, Explore the 64, and Your reading actions. Tap the brand to return home from any view. No persistent navigation row takes space from the cards.
- **Cast:** The active casting interface. Enter a question, then throw three animated coins six times — each throw appends a line to the forming hexagram (displayed in real time from bottom up). Coins display ☀ (yang, value 3) or ☽ (yin, value 2). Sums of 6 (Old Yin) or 9 (Old Yang) are flagged as moving lines.
- **Reading:** Illustrated primary hexagram with Judgment, Image, and commentary; clearly labeled general moving-line reflection prompts; and a linked relating hexagram when applicable.
- **Reference (All 64):** One illustrated reading card at a time, with previous/next controls and a hexagram picker below the card, plus arrow keys and horizontal swipes. The picker is searchable by number, name, Chinese, or trigram. Long passages scroll within the card.

**Key features:**
- Coin-flip animation on each of the six throws
- Changing lines distinguished by symbols and color, with general reflection prompts
- Full 64-hexagram reference database embedded in JS
- "Coin Oracle Method" modal explaining preparation, line values (6/7/8/9), and how to interpret the result
- Latest reading remains accessible during the session

Artwork prompts, contextual assignments, and design notes: [I Ching copper edition](docs/iching-artwork.md). Original page: [archived before the redesign](archive/iching_oracle.pre-copper-2026-09-28.html). Browser checks: `tests/iching_oracle.cjs`.

**How to use:** Open `iching_oracle.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **I Ching Oracle**.

---

### Tao Te Ching

**File:** [tao_te_ching.html](tao_te_ching.html)

A black-and-gold, phone-first reader for all 81 chapters, with the supplied ChatGPT Luna Medium translation by default and the received Chinese text on the reverse. Original line breaks and paragraph spacing are preserved throughout. An English translation selector switches to James Legge (1891) and remembers the choice. High-resolution illustrations appear above the passage; each chapter has an explicit thematic image assignment. All artwork is embedded for offline use. Longer passages receive more reading space, with scrolling confined to the passage and navigation kept in view.

A new daily chapter opens each local calendar day, following a shuffled 81-day cycle with no repeats within a cycle. The daily selection also refreshes at midnight or when the app resumes on a new day. Use **Chapters** to jump, **Random** to explore, and **Flip** to switch languages. Arrow keys navigate and Space flips the card. Chapter 1’s rendering note is separately expandable under the ChatGPT Luna Medium translation. Artwork prompts and chapter-by-chapter connections are recorded in [the artwork notes](docs/tao-te-ching-artwork.md).

---

### Recipes

**File:** `recipes.html`

A personal health-protocol recipe reference and daily compliance app for seven functional preparations — powders, smoothie cubes, a medicinal brew, and a chai masala — each targeting specific biomarkers (LDL-C, ApoB, nitric oxide, AMPK/autophagy). Inspired by Dr. Michael Greger's work and Ayurvedic traditions.

**The 7 recipes:**

| Name | Lane | Target |
|---|---|---|
| **Portfolio+ Powder** | Sprinkle | LDL-C / ApoB / LDL-P backbone |
| **BALT Powder** | Swallow | Black Cumin · Amla · Long Pepper · Turmeric |
| **SEP Smoothie Cubes v1.5** | Meal | β-glucan · Resistant starch · Protein · Bile acid binding |
| **Nitric Oxide Core Powder** | Vascular/Mitochondrial | Endothelial & mitochondrial efficiency |
| **Adaptabrew™ v2.2** | Brew | Calm Focus Edition · 100–200 cups per batch |
| **UrbanYogi Chai Masala v2.1** | Brew/Seasonal | Ayurvedic · Winter & Summer modes |
| **Polyphenol Pulse v1.1** | Hormetic | AMPK · Autophagy · 2× per week only |

**Key sections (three screens via bottom navigation):**

- **Home:** Searchable recipe card list with color-coded lane tags. Live search filters cards in place.
- **Daily:** Tap-to-check daily compliance checklist split into Always-on (Portfolio+, BALT, SEP Smoothie, Nitric Oxide, Adaptabrew) and Rotational (Chai Masala, Polyphenol Pulse).
- **Lanes:** Systems view mapping each recipe to its functional delivery lane (Swallow, Sprinkle, Meal, Vascular/Mitochondrial, Brew, Hormetic) with documented cross-recipe interactions (e.g., turmeric stacking across BALT, SEP Cubes, and Adaptabrew).

Each recipe detail screen includes a hero block, color-coded stats bar (batch size, daily dose, prep time, difficulty), ingredients with quantities, numbered step-by-step instructions, and troubleshooting notes.

**How to use:** Open `recipes.html` in any browser. On iPhone: Safari → Share → Add to Home Screen → launches as **Recipes** with a dark green leaf icon.

---

## iOS Home Screen Icons

Most apps are configured for iOS "Add to Home Screen" via Safari. Each HTML file includes:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="[App Name]">
<link rel="apple-touch-icon" sizes="180x180" href="data:image/svg+xml,...">
```

The `apple-touch-icon` is inlined as an SVG data URI — no separate image file needed. Once added to the home screen, each app launches full-screen with no browser chrome.

**To install on iPhone:** Open the file in Safari → tap **Share** → tap **Add to Home Screen** → confirm name → tap **Add**.

| App | Icon | Home Screen Name |
|---|---|---|
| Project Dashboard | No icon defined (uses Safari default) | Project Dashboard |
| Gantt Planner | No icon defined (uses Safari default) | Gantt Planner |
| Agni | Dark amber with Agni flame motif | Agni |
| Astrology Engine | Dark navy with ♌ glyph | Astro Engine |
| Jyotish Sādhana | Deep amber radial gradient with white ॐ | Jyotish Sādhana |
| Kena Upaniṣad | Deep violet radial gradient with केन | Kena Upaniṣad |
| Kena Game | No icon defined (uses Safari default) | Kena · Memorization |
| Yoga Sudhakara | Deep teal with white ॐ | Yoga Sudhakara |
| Marginalia | Navy-to-steel-blue gradient with ✏️ | Marginalia |
| Recipes | Dark green radial gradient with 🍃 | Recipes |
| I Ching Oracle | Copper 易 glyph on black | I Ching Oracle |

---

## Life Atlas · Jyotish + BaZi

**File:** [mercury_atlas.html](mercury_atlas.html)

A self-contained app for ten life dimensions with native Jyotish and BaZi timing. It has mobile bottom navigation and a desktop sidebar. Jyotish covers the Mercury Mahadasha (9 February 2021–10 February 2038); BaZi supplies solar years 2021–2038:

- **Jyotish:** Separate Now and Timeline views show current Sūkṣma ratings across all ten dimensions and all nine AD timelines. Choose a dimension to recolor the 81 duration-proportional PD segments. Filters, zoom, panning, a minimap, keyboard navigation and Inspect mode support exploration.
- **Jyotish life map:** Compare ten dimensions across nine chronological PDs or Sūkṣma periods. Move between groups, jump to the current period, or enlarge cells. Tap any cell for dimension evidence, the PD baseline, exact SD times in UTC, and midpoint transit snapshots.
- **BaZi:** Now, Cycles, Months and Days views keep current context, luck/solar-year grids, month tiles and the daily calendar separate. Month and day details open in accessible popups.
- **Compare:** A yearly overview opens a dedicated month view, with a separate Shorter periods tab and a return-to-overview button.
- **Practice:** PD practice anchors and Metal/Yong Shen guidance.
- **Guide:** Interpretation, scoring weights, divisional-chart anchors and planet profiles.

The supplied whole-life model covers Career, Wealth, Marriage, Family, Children, Mind, Vitality, Learning, Spiritual and Reinvention. V6 retains the 729 period boundaries and audited true-node Lahiri transit data. It removes mean-centering: planet profiles use absolute support with zero as neutral. Career retains the rules-first AD→PD anchors with the v6 correction of Rahu AD → Rahu PD to mixed-transformative support. Its revised qualitative assessment is shown in parent details. Other parents use 15% MD, 25% AD, 60% PD and 25% AD–PD relationship. Explicit PD/SD rule notes are shown in period details and the Guide.

SD adds 16% of its profile, 20% PD–SD relationship and 5% AD–SD relationship. Transit evidence contributes 70% slow transits, full exact contacts and 45% fast SD-lord transits. SD normally shifts one band; two require an absolute short-term adjustment of at least 0.70 plus agreeing layer signs or a strong exact-contact term. A further guard limits transit-only reversals, and extreme ratings have separate checks. Intensity remains independent of support. Repeating the same AD and PD adds 0.34 for Rahu, 0.24 for Ketu, 0.16 for Mars, 0.12 for Saturn and 0.05 for other planets to intensity only. Color shows support; bars show intensity in current ratings, SD ribbons, comparison cells and detail badges. Legends explain both axes. The timeline’s intensity filter finds parents with a matching SD in the selected dimension; when combined with transit tone, both must match the same child.

Career parent scores use the preserved raw anchor × 70; other parent scores normalize by 1.25; SD scores normalize by 1.45. These are model indices, not probabilities. The app evaluates supplied rules offline; it does not recalculate ephemerides or repeat the source’s astronomical audit.

Current-period ratings and markers use exact UTC dasha boundaries and update automatically at transitions. The app checks the device clock at least once a minute and refreshes on focus, visibility restoration, or page restoration. Manual browsing selections remain in place.

Timeline widths represent duration within each AD; Life map columns use equal widths for comparison. The date range covers one Mahadasha, not an entire lifetime. Ratings are interpretive categories, not probabilities.

The native BaZi screen imports `mercury_atlas_native_systems_v2.html` unchanged as its assessment dataset: 18 solar years, 216 solar months, 6,790 daily entries and 216 Gregorian comparison samples, each with ten dimensions. BaZi uses its own Da Yun → solar year → solar month → daily modifier hierarchy. The app displays supplied scores and branch-relation notes; the attachment does not include their generator. Da Yun cards show timing only, not an annual rating presented as a decade rating.

**Compare** shows the two systems independently at each Gregorian month midpoint in a compact twelve-row overview. Full agreement labels have their own column; selected-month explanations and the ten-dimension comparison expand on demand. BaZi luck cycles fit side by side, and all eighteen solar years appear in a responsive assessment grid without horizontal scrolling. Out-of-range Jyotish dates are explicitly unavailable; internal indices are never averaged. Jyotish retains its original timeline and Life map, now grouped under one navigation tab. Practice includes both Jyotish anchors and Metal/Yong Shen guidance. Native BaZi current context follows exact supplied solar-term/luck boundaries and UTC date changes, checks the device clock every minute, and refreshes on resume without changing historical browsing selections. Daily entries are UTC date labels within solar months; boundary dates can occur in adjacent months.

Guidance is organized into Plan, Journal, Review and Practices sub-tabs, with keyboard navigation and preserved form drafts. Time horizons open a single accessible detail popup with actions, reassessment timing and independent readings. Mechanism explanations also open directly in popups. Practice topics and Guide reference sections expand on demand. Mobile controls stack or wrap, Guidance sub-navigation stays in normal flow, and content scrolls above the bottom navigation rather than behind it. Dialogs support Escape, trapped keyboard focus, an always-visible Close control, and focus return.

The Guidance tab adds the v4.2 date/domain/mode dashboard with strategic, medium, tactical and immediate horizons, action postures, reassessment boundaries, and explanations of directional convergence or contradiction. The source posture/classification rules are retained. Strategic summaries aggregate display bands within each system, not cross-system indices. Dates are sampled at 12:00 UTC; Today follows the local calendar until a historical date is selected. BaZi date context resolves the solar month and active luck pillar at that sample instant.

Journal history initially shows ten entries, with a button to load the next batch; calibration continues to use all entries. The local outcome journal freezes Jyotish PD/SD and BaZi month/day snapshots alongside observations, notes and usefulness ratings. Calibration reports descriptive match counts (percentages only from five entries), not predictive validation. JSON exports preserve snapshots. Validated imports merge new IDs while keeping existing entries; malformed imports change nothing. Storage failures are explicitly marked as session-only. `tests/mercury_guidance_journal.cjs` covers rule parity, journal round trips, frozen snapshots, invalid imports, safe text rendering, storage fallback and date following. It optionally accepts `mercury_atlas_guidance_convergence_journal_v4_2.html` for exhaustive rule comparison.

The v3 lower-layer Compare drill-down follows `mercury_atlas_native_systems_v3_lower_layer.html`: choose a Sūkṣma overlapping the displayed calendar month, then inspect all BaZi UTC dates intersecting its full exact interval. A proportional strip shows the month-clipped durations; separate previous/next and select controls keep short segments accessible. The daily support distribution and selectable heatmap show individual readings without averaging systems. Solar-term dates duplicated in the source use the later month’s record, as in the supplied logic. Current markers refresh without changing selected historical intervals.

The complete atlas before this change is archived at [the October 3 backup](archive/mercury_atlas/mercury_atlas_before_v3_lower_layer_2026-10-03.html), with its checksum in the archive README. `tests/mercury_lower_layer.cjs` checks source parity for all 729 daily windows and 216 month overlaps, interval endpoints, daily counts, navigation and responsive layouts; it optionally accepts the v3 source path.

`tests/mercury_native_systems.cjs` verifies the complete native dataset against its source-captured hash, navigation, independent current-period boundaries, resume handling, comparison coverage and responsive layouts. An optional source HTML argument verifies the embedded dataset byte for byte. Superseded shared-dasha BaZi tests and fixture are in `archive/mercury_shared_spine/` (historical commit `5a13c8a`).

**Validation:** `tests/mercury_dasha_atlas.cjs`, `tests/mercury_sookshma.cjs`, `tests/mercury_life_atlas.cjs`, and `tests/mercury_current_period.cjs` use Playwright with local Chrome. The life-atlas test optionally accepts the supplied `mercury_md_whole_life_heatmap_v6_dual_axis.html` path to compare all records and all 7,290 dimension results against the source. A checked-in v6 reference fixture also verifies all 7,290 outputs without requiring the external source file.

## Archives

- [Astrology engine snapshots and historical tests](archive/astrology_engine/README.md)

## Technical Notes

- **Pure HTML/CSS/JS — no framework, no build tooling.** Each file is entirely self-contained. All styles are inline `<style>` blocks, all logic is inline `<script>` blocks.
- **Offline capable.** No network requests at runtime — all apps work without an internet connection once the file is on the device.
- **No server required.** Open directly with `file://` in any desktop browser. On iOS Safari, serve from iCloud Drive or a minimal local server (`python -m http.server`) when installing to the home screen.
- **Data embedding pattern.** Marginalia uses a `<script type="application/json">` block for book data; the other apps embed data directly in JavaScript constants. Everything stays in one file while keeping data clearly separated from logic.
- **Dark theme throughout.** All apps use CSS custom properties for a consistent dark palette with status bar styling set to `black-translucent` for edge-to-edge appearance on iPhone.
- **Mobile-first layout.** Fixed bottom navigation bar, scrollable content area, and thumb-sized tap targets. Viewport set to `width=device-width, initial-scale=1, viewport-fit=cover` with `env(safe-area-inset-*)` padding for notch / Dynamic Island compatibility.

`tests/mercury_app_navigation.cjs` checks mutually exclusive task views, BaZi popup navigation, Compare drill-downs, responsive widths from 320–1440px, and bounded BaZi screen heights on mobile. Guidance uses a compact horizon grid with details in popups; Practices and Guide use expandable topics.

`tests/mercury_control_layout.cjs` checks individual control bounds, text overflow, expanded popup content, sibling overlap, and clearance above bottom navigation at 320–1024px with standard and enlarged text.
