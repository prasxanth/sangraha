# v15.1 integration

Source: supplied `dynamic_astrology_engine_latest_v15_1.html`, compared against the prior supplied v14 and the current mobile application. No catalog entries change in this release.

## Changes

- Selected Vimshottari periods now hold their selected lord path fixed while transits vary across the period. MD uses only its lord; AD uses MD + AD, and so on, with truncated weights renormalized. All-life and other-system date ranges continue to sample changing Vedic paths.
- Child-period support and activation ranges are exposed separately in period evidence. They no longer redefine the parent baseline.
- Added unsigned activation (0–2) alongside signed support (−2 to +2), with native Vedic, Western and Saju calculators. Activation represents modeled engagement/intensity, not favorability or event probability.
- Kāla summaries now distinguish activation leaders from strongest support and weakest support. The playbook retains its support-sorted behavior.
- Cycles includes a gold-scale activation heatmap with the same Map/Details controls, touch magnifier, keyboard navigation and drill-down as existing mobile maps. Expand evidence for per-system values, fixed weights and next-level ranges.
- Removed stored planet/house influence-score targets and Mahādaśā ranking-order benchmarks, their comparisons and old API. Objective varga-placement checks remain available through `getVargaPlacementRegression()`.
- Added period support/activation/breakdown APIs, optional `activationCalculator(ctx)` for external systems, `getSystems().hasActivation`, model export metadata and two validation invariants.

## Integration corrections

- Saju, Western and custom cycle paths cannot be interpreted as Vimshottari lord paths. They are scored as date windows using changing Vedic dashas.
- Missing activation coverage returns `null` and displays “not supplied”; it is never replaced by absolute support or a quiet score. Available providers are normalized per sampled date, preserving imported-system coverage semantics.
- Transit evidence now uses the same selected path as period scoring. Root/all-life midpoint paths are labeled as illustrations, not fixed baselines. Root averages now use the weights of their sampled paths (normally 38% for five-level paths), as specified by the supplied update.
- Period evidence labels changing versus fixed paths. Child-period cache keys include exact endpoints as well as lord path.
- Preserved v14 catalogs, eligibility rules, source provenance, profile storage, responsive navigation, selected ayanāṃśa, transit/natal caching and lazy tab rendering.

## Verification

`tests/astrology_v14.cjs` retains four-profile catalog, Saturn, eligibility, responsive-view and filter checks.

`tests/astrology_v15.cjs` covers all four profiles; bounded native activation values; selected MD stability when descendant lookup changes; AD weights and child ranges; Saju/Western path isolation; missing and independently supplied external activation; removed benchmark symbols; mobile magnifier/details; desktop activation display.

Run from the repository root with Playwright installed:

```sh
NODE_PATH=/tmp/kala-v14/node_modules node tests/astrology_v14.cjs
NODE_PATH=/tmp/kala-v14/node_modules node tests/astrology_v15.cjs
```

Chrome defaults to its standard macOS location; override with `CHROME_PATH`. Tests disable network providers for reproducible analytical-fallback behavior. Live Swiss Ephemeris loading is not covered.

Built-in validation: **66/66 required chart anchors and 28/29 synthetic checks**. The prior reference-profile devatā regression remains unchanged and visible. The new checks do not turn it into a passing result. The existing interpretive scores remain engine heuristics, not independently validated forecasts.
