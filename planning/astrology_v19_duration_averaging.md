# Duration-weighted period scores (v19)

A parent now summarizes the periods it actually contains:

`parent = Σ(child value × covered child duration) / Σ(covered child duration)`

This recurses through **MD → AD → PD → Sookshma → Prana** for every life domain. A complete MD contains 6,561 Prana leaves. For complete child periods, the duration fraction is the child's Vimshottari years divided by 120 (Venus 20/120, Ketu 7/120, etc.). These fractions are applied once through the actual dates. They are not multiplied into scores a second time.

Support, activation, per-system comparisons, combined scores and the separate exploratory expression indices follow the hierarchy. Combined scores normalize the available systems at each leaf before time averaging. Missing per-system evidence retains its covered duration, so a partially covered child does not receive a full child's weight. Foreign cycle views retain their date-range calculations and do not acquire a Vimshottari lord path.

## Leaf model and boundaries

Each Prana uses its canonical midpoint, with the existing five-lord influence weights (15%, 25%, 25%, 20%, 15%). Vedic support uses 24% transit contribution; activation uses 55%. Those are existing application policies at this depth, **not canonical scriptural percentages**. A clipped date range keeps the original leaf value and weights only its overlapping duration. Thus subdividing a range cannot silently change the timing sample.

This is an exact duration integral of the app's piecewise-constant Prana model, not an exact continuous transit integral or a validated prediction. Score changes reflect both aggregation of descendants and the use of the deepest-level model. The old independently calculated selected-path score is retained only as diagnostic context. Natal rankings remain a separate model. Full Shadbala, avasthas and Ashtakavarga remain unimplemented.

## Interface and performance

Method comparison includes an expandable duration ledger: child duration, time percentage, support, and contribution. Existing heatmaps and navigation retain one support number. Calculation runs in batches with visible progress and yields to browser interaction. Profile calculations use request IDs to discard superseded work. Full-horizon calculation is more expensive than the prior coarse model; an offline desktop Chrome run took about 30 seconds while other browser tests were running. Cached period navigation avoids repeating the full calculation. This is not a mobile-device performance benchmark.

Instant astronomy/timing caches now use exact timestamps instead of rounding to hours or days. The previous cache could return whichever nearby timestamp had been requested first. Instant caches are bounded; natal associations and repeated Western/Saju calculations are shared without changing their formulas.

## Reference results

Default saved profile, offline reference natal chart and internal transit fallback, default Vedic/Western/Saju blend, BNN excluded. These numbers are provider-specific; live Swiss Ephemeris can differ.

Mercury MD career combined support: **+0.274750** (display **+0.27**). Vedic-only support: **+0.049764**. The prior independent MD calculation was approximately +0.205196 combined; it was not the duration average of its children.

| Mercury AD | Time weight | Combined career support |
|---|---:|---:|
| Mercury | 17/120 | +0.276786 |
| Ketu | 7/120 | +0.326539 |
| Venus | 20/120 | +0.349066 |
| Sun | 6/120 | +0.435786 |
| Moon | 10/120 | +0.305197 |
| Mars | 7/120 | +0.192182 |
| Rahu | 18/120 | +0.192894 |
| Jupiter | 16/120 | +0.256983 |
| Saturn | 19/120 | +0.231672 |

The weighted AD mean, weighted PD mean, and direct weighted mean of all Pranas agree. No desired planetary ranking, target date or life event was used to calibrate these results.

## Reproducible checks

Run with Playwright installed and Chrome available:

```
NODE_PATH=/tmp/kala-v14/node_modules node archive/astrology_engine/tests/astrology_v19.cjs
NODE_PATH=/tmp/kala-v14/node_modules node archive/astrology_engine/tests/astrology_score_display.cjs
NODE_PATH=/tmp/kala-v14/node_modules node archive/astrology_engine/tests/astrology_v17.cjs
```

The v19 regression checks every parent inside Mercury MD, every domain, selected-system support and activation, direct leaf versus nested aggregation, duration fractions, clipped boundaries, independent leaf formula reconstruction, system-selection changes, expression rollups, missing coverage and query-order independence. UI checks cover single-score navigation, colors, and mobile overflow. The v17 test's old formula assertion now explicitly tests the preserved context model; the v19 test covers the replacement period model.

Historical v17/v18 sampling reports describe their original models; they are not measurements of the v19 hierarchy. Arithmetic consistency does not establish the predictive validity of the underlying astrology model. The existing devata reference regression remains a known unrelated failure; it has not been weakened to make this change appear fully green.

Final verification: all three regression scripts passed. The hierarchy audit made 87,285 comparisons; maximum absolute discrepancy was 3.13×10⁻¹². The four-profile suite also passed 3,888 domain/MD–AD assessments and mobile layout checks. Built-in validation remains 66/66 required anchors and 29/30 synthetic checks, with the pre-existing devata failure described above.
