# Bucket-first display and direction map

Only the bucketing/direction presentation from `dynamic_astrology_engine_latest_v17_2.html` is incorporated. Original support, activation, expression, duration integration, weights and astronomical calculations remain unchanged. Existing `bucket()`/`activationBucket()` helpers used elsewhere are not repurposed as calculation inputs; the new display classifiers are independent.

Support cutoffs: ≥1.20 Exceptional; ≥0.75 Great; ≥0.35 Good; >−0.35 Mixed / Neutral; >−0.75 Challenging; >−1.20 Difficult; otherwise Very Difficult. Activation cutoffs: ≥1.50 Very High, ≥1.15 High, ≥0.75 Moderate, ≥0.35 Low, otherwise Quiet. Scale uses the same unsigned thresholds with Exceptional Scale, Large Scale, Moderate Scale, Limited Scale, Local / Narrow. Missing input is explicitly not supplied, not zero. Classification uses unrounded continuous values; numbers displayed beneath labels are rounded for readability.

Main period navigation, support grids, selected-period summary, playbook scores, and mobile map previews/details present the bucket first and one continuous score beneath. Absolute support colors are fixed by semantic bucket: +0.11 and +0.14 have the same neutral color. Optional relative contrast remains comparative and does not change bucket labels or any values.

The expandable Direction heatmap uses the attachment's categorical rules:

- High engagement/reach: activation ≥1.15 OR scale ≥1.15; high consequence: BOTH.
- Support ≥0.75 with both: EXPAND.
- Support ≥0.35 with either: ADVANCE; otherwise BUILD.
- Mixed support with both: PIVOT; with either: SELECTIVE; otherwise HOLD.
- Support ≤−0.35 with either: RESTRUCTURE; otherwise PROTECT.

The attachment's special case for support ≤−0.75 with both retains RESTRUCTURE and a stronger explanation. Its invented numerical direction score is deliberately omitted: direction is categorical, not another averaged score. Array indices used by the shared heatmap are presentation keys only and never enter calculations or appear as numbers.

Each category is assigned AFTER duration averaging the continuous inputs; categories are never averaged. Support/activation use selected-system scores. Scale remains the existing Vedic second expression facet, explicitly named in details and the scale key. Without Vedic there is no scale input, so direction is unavailable. No alternative scale engine is imported.

The map uses the existing mobile touch magnifier, domain Details dropdown and Cycle Zoom navigation. Preparation is on-demand and yields between domain/period evaluations; stale work is discarded if the view/profile changes.

Regression coverage includes every threshold, all eight outcomes, missing values, neutral color identity, exact reference Mercury MD score preservation, unchanged expression rollups, mobile touch/details behavior, bucket-plus-number navigation, and no horizontal overflow. AST comparison confirms changed existing functions are renderers and color helpers only.

On narrow screens the direction grid uses readable two-letter codes (EX, AD, BU, PV, SE, HO, RS, PR), with an explicit key beneath it. Accessible labels, touch previews and the Details view retain full action names and underlying inputs. Desktop cells use full names.
