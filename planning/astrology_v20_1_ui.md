# v20.1 Direction UI integration

Source: `astrology_engine_latest_v20_1.html`. Scope follows the explicit user clarification: keep context unscored; import UI and action-label updates.

## Imported

- Direction uses EXPAND, ADVANCE, BUILD, PIVOT, SELECTIVE, HOLD, RESTRUCTURE or PROTECT as its primary label. Mobile cells use keyed abbreviations; touch previews and Details spell out the action.
- Secondary lifetime bands are Relative crest (90+), Stronger than usual (70+), Typical range (30+), Softer than usual (10+) and Relative low (below 10). Percentile boundaries and duration-weighted reference calculations are unchanged.
- The attachment's action classifier uses existing lifetime rank to refine guidance within the absolute support class. Mixed or adverse support cannot become BUILD, ADVANCE or EXPAND through relative rank. This changes categorical recommendations, not numerical scores.
- Direction colors follow action semantics with modest percentile intensity. Support heatmaps retain their existing lifetime-intensity default and absolute labels.
- Preview and Details expose raw support, activation, scale and percentile. Missing Vedic scale produces “Not supplied” rather than invented guidance.
- Direction assessment/context APIs and profile-export metadata identify the unscored-context policy.

## Deliberately excluded

The attachment's numerical yoga and Shani overlays, sensitivity tables, caps and adjusted score fields were not imported. Existing yoga/Shani evidence remains informational. Existing scoring contributions were not removed or reweighted.

Raw support, activation, expression/scale, MD→AD→PD→Sookshma→Prana duration aggregation, transit calculations and lifetime percentile functions are unchanged. Function-source comparison against the preceding commit confirms changes are confined to Direction classification/display, lifetime label wording, validation and export.

## Verification

Browser regression commands (Playwright and Chrome):

- `archive/astrology_engine/tests/astrology_v20_display.cjs`: 900 support-gate combinations, representative v20.1 classifications, unchanged all-domain raw metrics, reference percentile, mobile map/preview/details, text containment and missing-scale behavior.
- `archive/astrology_engine/tests/astrology_lifetime_display.cjs`: duration weighting, ties, boundaries, all-domain baseline, zoom invariance, configuration invalidation and unchanged support.
- `archive/astrology_engine/tests/astrology_scale_display.cjs`: bucket boundaries, duration-consistent expression, unchanged support/activation and mobile views.
- `archive/astrology_engine/tests/astrology_score_layout.cjs`: desktop/mobile numeric containment across navigation, cards, chips, grids and playbook.

Offline reference Mercury MD Career support remains `0.2747501437659854`; Mercury/Rahu AD Career remains `0.19289385134913167`, at lifetime percentile `21.249127821180853`.

These are implementation regression checks, not empirical validation of astrology. Action and band thresholds remain application conventions. The pre-existing built-in devata synthetic invariant failure is outside this UI integration; it is not represented as passing here.
