# v18 — support-only cells, denser averages and separate domain expression

## What changed

The desktop grid shown in the user's screenshot contained a support number and a second `0`/`+` category symbol. Cells now show one signed support score, to two decimals. The category is named in the tooltip. The older grid also displays only the support score. Small values rounded to zero no longer display a misleading negative zero in these cells.

The default color scale is now fixed at −2…+2. Relative contrast remains available explicitly; its stretched colors should not be read as the magnitude of an absolute difference.

The previous three-date average was particularly sensitive to which Western transits it happened to sample. Default non-Vedic period averages now use uniform mid-bin samples targeting daily spacing, with a minimum of 12 and maximum of 192 points. Long intervals are evenly covered subject to that cap. Coarse three-date and midpoint modes remain labeled previews. Old saved profiles using the former three-date default migrate once to dense sampling; versioned storage preserves subsequent explicit choices. Existing BPHS fixed-path and depth-specific sampling remains intact.

## All-domain distinction

Support remains the sole primary heatmap metric. Activation is separate. A new **experimental expression** section in the Vedic-method comparison exposes two facets per domain:

| Dimension | Facet 1 | Facet 2 |
| --- | --- | --- |
| Career | Recognition / advancement | Authority / scale |
| Wealth | Accumulation / opportunity | Stewardship / continuity |
| Marriage | Connection / reciprocity | Commitment / shared life |
| Family | Belonging / care | Responsibility / continuity |
| Children | Nurture / connection | Guidance / development |
| Vitality | Routine / resilience | Rest / restoration |
| Mind | Clarity / integration | Focus / discipline |
| Spiritual | Study / discernment | Contemplation / service |
| Reinvention | Exploration / change | Rebuilding / integration |
| Learning | Acquisition / inquiry | Mastery / application |
| Autonomy | Initiative / agency | Ownership / self-direction |
| Mentorship | Teaching / transmission | Stewardship / legacy |

Expand each facet for planet, house, varga, association, detected-yoga and selected-period evidence. The next-level comparison lazily renders both facets for each child period. Its bars are expression indices, not an alternative support heatmap. The `getDomainExpression(period, domain)` API exposes the evidence programmatically.

The pasted note's 2026–28 and 2034–37 career trajectories are **hypotheses**, not encoded target dates. No promotion history, profile name or expected ordering is used to calibrate these indices. Recognition, capacity, intensity and ease are not interchangeable.

## Expression policy and rule ledger

These indices are explicitly modern application policy: 60% structural evidence adjusted for active-lord connection, 25% the strongest participating relevant registered yoga, and 15% domain transit activation. Structural evidence averages the registered significators and relevant house lords, using 35% partial strength, 35% routed varga condition and 30% house ownership/occupation. Direct active-lord participation and associations affect delivery. Yoga participation uses the selected path and normalized hierarchy, not hidden descendant paths. Arbitrary date ranges sample changing paths.

Expression scores range from 0 to 2. Correlated features are not independent confirmation. These values do not alter support, activation, BNN or combined-system weights. BNN remains an independent opt-in comparator.

The rule-coverage ledger now includes the experimental expression layer and retains explicit gaps. This release does **not** claim full BPHS MD/AD exceptions, full Shadbala, avasthas or Ashtakavarga. Nor does the existing yoga detector cover every classical condition. Expression indices cannot establish a guaranteed career crest or life event. The legacy natal/Mahadasha ranking page still uses its separately labeled exploration model.

## Triple calculation check

1. Independently reconstructed all nine Mercury AD BPHS totals from MD, AD, relationship and transit contributions; equality within 1e−12. Every AD uses the same 37.5% MD / 62.5% AD baseline split and 8% support-transit blend. These are inherited app coefficients, not verified textual percentages. No coefficient was changed to obtain a preferred ordering.
2. Reconstructed combined-system sums for all 12 domains in the Venus and Mars MDs and Mercury/Venus and Mercury/Mars ADs, across four sampling settings. Each domain uses its configured system weights consistently across periods. Career remains Vedic 45%, Western 35%, Saju 20%; BNN is excluded by default.
3. Replayed independently calculated Swiss/Moshier natal positions, Lahiri ayanamsa and every requested transit, and compared coarse/default/192/384 samples. The separate Python lunar balance still reproduces Swiss dasha boundaries. The offline/Swiss date convention difference documented in v17 remains.

See [all-domain numeric audit](astrology_v18_sampling_audit.json) for results and per-system contributions. The old [v17 Mercury table](mercury_career_v17.json) is historical and uses the previous three-date combined averages.

The earlier offline Mercury/Venus +0.453 versus Mercury/Mars +0.109 was arithmetically correct but sampling-sensitive. In particular Venus's three-date Western component was +0.619, compared with +0.308 at 192 dates. A model can distinguish these periods, but the original displayed 0.5 versus 0.1 is not a verified prediction of real-world career magnitude.


| Period | New offline default | Swiss default cross-check |
| --- | ---: | ---: |
| Venus | +0.327 | +0.324 |
| Mars | +0.136 | +0.102 |
| Mercury / Venus | +0.342 | +0.358 |
| Mercury / Mars | +0.111 | +0.141 |

## Validation

The v17 regression suite now also covers support-only cells, the 24 expression facets across all four profiles, bounded and reconstructible expression totals, no changes to support from expression evaluation, and dense sampling. The v15/v16 suites check fixed paths, missing-coverage normalization, BNN independence and comparison interactions. Built-in validation retains 66/66 chart anchors and its known 29/30 synthetic result; the pre-existing devata failure remains visible.

Run the independent audit with Playwright available to Node and pyswisseph installed for the selected Python:

```sh
ORACLE_PYTHON=/path/to/python node tests/astrology_v18_audit.cjs
```

The resulting temporary report includes full input/provider context. Live CDN/WASM loading is not validated by replay tests. Numerical convergence is checked for the listed reference periods across all domains, not every possible chart.
