# Lifetime-relative display, unchanged scoring

This update replaces the primary Direction map's action categories with **Peak / Above average / Typical / Below average / Trough**. It adds lifetime percentile intensity to period support heatmaps while keeping the existing absolute support labels and scores. It does not change support, activation, expression, astronomical calculations, weights, or duration averaging. The previous action classifier remains available internally but no longer supplies the primary Direction map.

## Reference distribution

For each active profile and life domain, the baseline is the existing Prana support series from birth through the configured life horizon. Each leaf receives the duration actually included in that interval. A selected period's unchanged duration-averaged support is compared with that distribution:

`percentile = 100 × (duration below score + 0.5 × duration tied at score) / total duration`

This is a time-weighted empirical midpoint percentile, not the fraction of equally weighted periods. Ties are grouped at 12 decimal places to avoid irrelevant floating-point differences. A constant distribution has a 50th-percentile midpoint. Values outside the observed distribution receive 0 or 100; unavailable distributions return missing, not zero.

The baseline is independent of zoom and calendar-year filters. Changing the profile, life horizon, selected systems, weights, or clearing the calculation cache invalidates it. Domain filters do not change an individual domain's population. Overview/navigation scores averaged across selected domains use a matching distribution of those same domain averages, not an average of unrelated percentiles.

A parent is compared with the Prana distribution, not with other parents at its depth. This makes the reference stable across zoom levels, but does not mean a Mahadasha at the 80th percentile exceeds 80% of Mahadashas. It means its average exceeds approximately 80% of modeled lifetime time, with ties split as above. Scores and percentiles are never fed back into one another.

## Labels and visuals

- Peak: ≥90th percentile.
- Above average: ≥70th and <90th.
- Typical: ≥30th and <70th.
- Below average: ≥10th and <30th.
- Trough: <10th.

These names denote percentile bands, not comparisons against the arithmetic mean or BPHS thresholds. Absolute support buckets are also explicitly labeled as engine conventions. The UI rounds percentiles and continuous scores for readability while classifying the unrounded values.

Default period colors use a sequential pale-to-teal palette. Pale means relatively low; it does not mean adverse. The optional absolute semantic support palette remains available. Legacy visible-range contrast modes remain optional comparisons. Natal/factor plots retain their own absolute support interpretation rather than being compared against lifetime period scores. Activation and expression retain their independent unsigned scales.

The main Direction map opens by default. Mobile grid codes are PK / AA / TY / BA / TR; previews and the Details selector spell out the names and show the percentile, absolute support, activation, and existing Vedic expression facet. A support percentile remains available when Vedic is not selected; the Vedic expression and context are marked unavailable instead of fabricated.

## Yoga and Śani boundaries

Details expose existing detected yoga evidence relevant to the selected domain's expression facet and a clearly labeled midpoint Śani/Sāḍe Sātī illustration. No new yoga bonuses, contribution caps, cancellation logic, divisional-chart gates, or named-phase penalties are applied. No blanket Sāḍe Sātī subtraction is introduced. Existing evidence may overlap; the UI does not claim independent corroboration or a complete classical implementation. Full Shadbala, avasthas and Ashtakavarga remain unimplemented.

## Verification

`archive/astrology_engine/tests/astrology_lifetime_display.cjs` independently checks duration-weighted percentile arithmetic, ties, empty distributions, all percentile boundaries, all 12 reference domains, total lifetime coverage, zoom/color invariance, horizon/system/weight invalidation, unchanged reference scores, mobile previews/details, and non-Vedic selection.

Existing layout and scale-display suites verify number containment, score identity, period navigation, color options, and activation/expression views. An AST comparison against the previous commit confirms existing calculation functions are unchanged; modifications are limited to renderers, evidence presentation, and color/display helpers.

Default offline example (not a target used for calibration): Mercury/Rahu Career remains **+0.19289385134913167**, Mixed / Neutral. Its duration-weighted lifetime percentile is **21.249127821180853**, so the relative label is Below average. Mercury MD Career remains **+0.2747501437659854**. Provider/profile configuration changes can change the reference and its percentiles.
