# v20.4 parent-dominant hierarchy

Imported the hierarchy-specific delta between the supplied v20.3 and v20.4 documents into the current application. The current compact charts, Support default tab and unscored Direction context policy are preserved.

## Model change

MD / AD / PD / Sookshma / Prana active-lord weights change from 15/25/25/20/15 to **50/30/12/6/2**. These are computational conventions, not BPHS percentages or validated predictive probabilities. The shared weights feed existing structural support, activation, transit contacts, expression, yoga participation and practice timing wherever those calculations already used them. No new yoga/Shani overlay is enabled.

The transit active-lord multiplier now divides by 0.50 instead of 0.25, as specified in the attachment. Its maximum stays 1.30; the five multipliers are 1.30, 1.18, 1.072, 1.036 and 1.012. This prevents doubling the transit boost just because MD is heavier. Missing-level fallbacks use 0.02 rather than the legacy 0.15.

Prana midpoint sampling, actual-duration integration, clipped-interval handling, system blending, Direction thresholds and percentile algorithms are unchanged. Scores and the reference lifetime distribution are recomputed, so percentiles and categories can change. The parent-dominant policy applies to the lord-weighted components, not every association/transit term; it does not guarantee smaller variation in every domain or a predetermined planetary order.

Guide, method evidence, public weight-policy API, export metadata and built-in validation expose the new policy.

## Reference comparison

Deterministic offline fallback, default saved reference birth profile, selected systems Vedic + Western + Saju. Exact numbers may differ with Swiss Ephemeris or other profile/system settings. Career's default blend is 45% Vedic, 35% Western, 20% Saju.

Mercury MD combined Career support: **+0.274750 → +0.259078**. Vedic-only support: **+0.049764 → +0.014937**.

Mercury MD / Venus AD / Career:

| PD | Old support | New support | New Vedic-only | Activation | Scale | Lifetime percentile | Direction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Venus | +0.345300 | +0.323314 | +0.089561 | 1.009 | 0.875 | 62.58 | SELECTIVE → HOLD |
| Sun | +0.450552 | +0.420211 | +0.118165 | 1.067 | 0.943 | 89.21 | ADVANCE → ADVANCE |
| Moon | +0.334830 | +0.322328 | +0.101890 | 0.957 | 0.953 | 62.26 | HOLD → HOLD |
| Mars | +0.288929 | +0.292305 | +0.085257 | 0.944 | 0.933 | 51.86 | HOLD → HOLD |
| Rahu | +0.365588 | +0.363818 | +0.110482 | 0.928 | 0.897 | 75.94 | ADVANCE → ADVANCE |
| Jupiter | +0.340204 | +0.320597 | +0.145212 | 0.977 | 0.956 | 61.60 | HOLD → HOLD |
| Saturn | +0.382497 | +0.372469 | +0.117310 | 1.090 | 0.986 | 78.30 | ADVANCE → ADVANCE |
| Mercury | +0.287915 | +0.281744 | +0.066486 | 1.063 | 0.977 | 48.07 | HOLD → HOLD |
| Ketu | +0.388858 | +0.375275 | +0.081469 | 1.073 | 0.886 | 79.01 | ADVANCE → ADVANCE |

Ketu remains ADVANCE while Mercury remains HOLD in the combined view. Their new combined support gap is 0.093531. The Vedic-only gap is 0.014983, contributing only 0.006742 after the 45% blend weight. Thus approximately 93% of the remaining combined gap comes from the unchanged Western/Saju contributions evaluated over different dates. The rank is not evidence that Ketu is intrinsically a stronger career planet.

Direct per-system Career support confirms the source of the difference:

| PD | Vedic (45%) | Western (35%) | Saju (20%) |
| --- | ---: | ---: | ---: |
| Mercury | +0.066486 | +0.196075 | +0.915995 |
| Ketu | +0.081469 | +0.462348 | +0.883962 |

The Western contribution is the main driver of the remaining combined gap; Saju slightly favors Mercury in this pair.

No result was tuned to force Mercury above Ketu. Across these nine PDs, the combined Career support range narrows from about 0.163 to 0.138; the Vedic-only range narrows from about 0.111 to 0.079. This is a model sensitivity observation, not empirical validation.

The accompanying JSON records all 12 domains before and after, including MD, Venus AD and all nine PDs.

## Verification

- 87,420 arithmetic checks over 6,561 Prana leaves, all domains and selected systems; maximum discrepancy below 3.2e-12.
- Isolated unit-signal tests verify the five influence weights for both support and activation across all 12 domains, including normalized shorter paths.
- Transit multipliers verified independently against the declared values; public API cloning and unscored-context policy checked.
- Existing duration, missing-coverage and clipped-period identities retained.
- Direction UI and percentile/scale regressions use new model reference scores, while still checking display operations cannot alter scores.

The pre-existing devata synthetic validation issue is outside this change; arithmetic consistency does not establish predictive accuracy.
