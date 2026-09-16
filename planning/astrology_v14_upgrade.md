# v14 integration — September 2026

Source: supplied `dynamic_astrology_engine_latest_v14.html`. Its data and algorithms were selectively merged into `astrology_engine.html`; the existing application was not replaced. Source provenance labels describe the supplied registry's conventions, not independently verified textual citations.

## Coverage

| Area | Previous engine | Integrated engine |
| --- | --- | --- |
| Yoga rule catalog | No dedicated registry | 34 rules across 10 major families |
| Devatā | 11 channels, 2 specialized associations | Same channels plus 11 families and 51 forms |
| Practice | 12 entries | 47 entries, 10 family definitions |
| Texts | 20 entries | 33 entries |
| Vedic provenance records | 6 | 10 |

Yoga families cover the five Mahāpuruṣa yogas, Moon and Sun configurations, classified Parivartana, Raja and Dhana associations, Viparita, cancellation audits, learning/prosperity configurations and selected nodal configurations. Rule evidence, participants, polarity, school conventions and provenance remain inspectable. Coverage is explicitly bounded; it does not claim every yoga or tradition.

Devatā forms distinguish received matches, supporting affinities and contextual entries. They do not infer or replace an established Iṣṭa. Practices now have eligibility explanations, categories, complete supplied instructions, timing affinity and diverse routine selection. Blank received records no longer satisfy the received-anchor requirement. Initiation, teacher and lineage-sensitive entries remain excluded from automatic routines.

Added texts include selected Taittirīya, Chāndogya and Bṛhadāraṇyaka study, Dṛg Dṛśya Viveka, Aparokṣānubhūti, Aṣṭāvakra Gītā, Uddhava Gītā, Hanuman Chalisa, Shiva Mahimna, Kanakadhara, Subrahmanya Bhujangam, Sri Sukta and Purusha Sukta. The complete library is browsable; foundation/intermediate/advanced levels and tradition guidance remain visible. Affinity is not readiness or a required syllabus.

## Timing and visualization

- **Paths → Yogas:** searchable 34-rule catalog with family/status filters, expandable evidence and natal-salience meters. Separate activation meters explain participating dashas and transit triggers.
- **Śani timeline:** dated sign-crossing windows for Sāḍe Sātī and fourth/eighth-from-Moon phases, with current-window emphasis, retrograde re-entry segments and provider context. Scan endpoints may clip windows.
- **Cycles → Transit delivery:** collapsible Gochara panel, signed domain bars, projected midpoint sky, active-lord contacts and Jupiter–Saturn joint activation. Midpoint illustrations are explicitly distinguished from sampled period scores.
- **Dharma:** searchable complete forms, practices and text catalogs; family/level and eligibility/status filters; keyboard-accessible expandable details. Text library appears under Practice → Browse all texts.

The supplied Gochara model includes Moon-relative quality, Lagna/house activation, Parāśari aspects, active-lord contacts, dignity, retrogression, combustion and conservative nodal aspects. It uses the selected ayanāṃśa and reports the ephemeris provider. Period transit weights are 8% for all-life, 10% MD, 17% AD, 27% PD, 34% Sookshma and 38% Prana. Adaptive transit sampling is separate from the generic system sampling selector. Whole-Mahādaśā ranking blends 90% structure with 10% projected transit contribution; evidence shows both.

These weights are engine heuristics from the attachment, not classical percentages or empirically validated event probabilities. Yoga activation is explanatory and is not added again as an independent domain score. Saturn windows are not automatically classified as uniformly unfavorable. Analytical fallback transit precision remains limited.

## Integration corrections and preservation

- Updated the Vedic knowledge version to `2026.09-v14`.
- Corrected an attachment tooltip call that assumed the old timing-breakdown array.
- Preserved per-date missing-coverage normalization for imported scoring systems.
- Corrected Saturn scanning when the final interval contains a sign transition; cache keys retain exact endpoints.
- Cached natal metrics and lord outcomes used repeatedly during adaptive sampling; profile/evidence changes clear scoring caches.
- Added public APIs for yoga, transit, Saturn, devatā-form and practice catalogs; expanded registration supports forms and family metadata.
- Retained family profile editing/persistence, mobile grouped navigation, period dropdowns, lazy tab rendering, themes and touch heatmap magnification.
- Western and Saju catalogs have no substantive content changes in the attachment; existing implementations remain intact.

## Verification

Chrome, analytical fallback with network providers disabled:

- All four profiles: 34/51/47/33 catalog counts; finite domain period scores; practice eligibility; all three new invariants; Saturn window midpoint/phase consistency.
- 390px mobile and 1440px desktop; no page overflow or runtime errors in tested views.
- Text search and combined filters; 12 signed transit bars; desktop Vedic, Yoga, Natal, Western and Saju views.
- Existing validation: **66/66 required chart anchors; 26/27 synthetic checks**. The reference-profile classical-first devatā regression already failed before this work (previous result 23/24). It remains visible and has not been weakened or marked passing.
- Live Swiss Ephemeris loading was not verified in this offline run.

Reproduce the focused checks from the repository root:

```sh
npm install --prefix /tmp/kala-v14 playwright
NODE_PATH=/tmp/kala-v14/node_modules node tests/astrology_v14.cjs
```

Set `CHROME_PATH` if Chrome is installed elsewhere.
