# v16 integration — BPHS primary and independent BNN

Source: supplied `dynamic_astrology_engine_v16_bphs_primary_bnn.html`, compared with the supplied v15.1 and the current mobile application. The attachment's method definitions and provenance labels are integrated as model data, not independently verified textual citations. No yoga, devatā, practice or text catalog entries change in this release.

## Calculations

The Vedic period baseline now uses the supplied **BPHS Classical Core**: natural nature, whole-sign lordship, D1 placement, dignity, domain relevance and the relevant divisional chart. Lord associations modify the fixed selected path, with separately normalized support and activation. The original exploratory natal metrics and domain-routed Mahādaśā ranking model remain distinct and are labeled in the comparison view.

Projected transit weights now differ by metric:

| Level | Support | Activation |
| --- | ---: | ---: |
| Mahādaśā | 5% | 20% |
| Antardaśā | 8% | 25% |
| Pratyantardaśā | 12% | 35% |
| Sookshma | 18% | 45% |
| Prana | 24% | 55% |

All-life and non-Vimshottari date ranges continue to sample changing Vedic paths. Selected Vimshottari periods retain their fixed path and report descendant ranges separately.

**Bhrigu Nandi Nadi** is a separate built-in comparator using domain significators, same-sign and trinal natal circuits, and Jupiter/Saturn/Rahu/Ketu transit activation. It does not import dasha timing, add another Vimshottari cycle or create a practice catalog. It is installed but unchecked by default. Its nominal weight is 0.15 per domain; with all three default systems selected, enabling BNN yields approximately 13.04% effective weight after normalization, not 15% of the final combination.

Numerical weights and scores are the attachment's fixed engine normalization, not scriptural percentages or validated event probabilities. Full Shadbala and Ashtakavarga are not implemented.

## Visualization and controls

Open **Cycles → Vedic methods · BPHS & BNN comparison**:

- Choose any life dimension and preview period-averaged support and activation side by side. Previewing does not change the combined score.
- Explicitly include/remove BNN with the comparison button or the system selector. Nominal and effective selected-domain weights are shown.
- Expand BPHS lord evidence for signed factor bars, lordship/placement/dignity/natural signals, varga evidence, selected-path weights and associations.
- Inspect BNN hero-to-actor circuits and expandable slow-transit triggers. Midpoint illustrations are labeled separately from period averages.
- Expand method provenance to see the supplied rule families and implementation boundaries.

The existing support and activation heatmaps automatically use the new primary model, and include BNN only when selected. Touch magnification, period dropdowns, lazy tab rendering, profile storage, catalog filters and the shared theme remain intact. The comparison stacks vertically on mobile.

## Integration details

- Added the method registry and APIs: `getMethodRegistry`, `getBPHSAssessment`, `getBNNAssessment`, plus method metadata in `getSystems` and configuration exports.
- Period breakdowns include BPHS assessments, association evidence and separate transit weights. Gochara evidence displays both weights.
- Preserved foreign-cycle path isolation and null activation coverage from the v15.1 integration.
- Cached repeated BPHS and BNN assessments using the existing profile/evidence invalidation behavior.
- Corrected repeated-lord association inflation: a planet is not associated with itself; the same unordered planet pair contributes only once per path.
- BNN-only selection exposes no borrowed Vimshottari cycle.

## Verification

Built-in validation: **66/66 required chart anchors and 29/30 synthetic checks**. The remaining failure is the pre-existing reference-profile devatā regression.

Chrome tests use the analytical fallback with network providers disabled:

- `tests/astrology_v14.cjs`: all four profiles, catalog counts/eligibility, Saturn windows, filters and responsive existing tabs.
- `tests/astrology_v15.cjs`: fixed parent scoring, child ranges, activation independence, foreign paths and existing heatmap interactions.
- `tests/astrology_v16.cjs`: four-profile BPHS/BNN bounds and cache isolation, distinct transit weights at every depth, BNN independence from dasha lookup, no self-association boost, preview versus opt-in, normalized comparator weight, BNN-only selection and mobile/desktop comparison controls.

Run from the repository root with Playwright installed:

```sh
NODE_PATH=/tmp/kala-v14/node_modules node tests/astrology_v16.cjs
```

Chrome defaults to its standard macOS path; override with `CHROME_PATH`. Live Swiss Ephemeris loading is not covered. The prior reference-profile devatā regression remains visible and has not been weakened.
