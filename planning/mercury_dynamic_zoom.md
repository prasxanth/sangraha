# Jyotish timeline subdivision

The PD overview remains the authoritative 81-parent view. Sūkṣma zoom displays the existing nine exact-UTC SD records for the selected PD. Prāṇa zoom computes nine children on demand for the selected SD; it does not replace stored records or journal/forecast snapshots.

Timing follows `childPeriods` in `archive/astrology_engine/2026-09-22_calibrated_v5.html`: start with the parent's lord, cycle through the nine Vimshottari lords, and allocate parent duration × lord years / 120. Boundaries use cumulative integer-millisecond rounding, with the final end pinned to the SD end. Intervals are half-open. The source's submillisecond timestamp precision is limited by JavaScript Date, as elsewhere in the Atlas.

Prāṇa support is an explicitly heuristic, parent-dominant extension of Atlas reasoning. The archived cold hierarchy assigns SD 0.06 and Prāṇa 0.02; its relative terminal share is 0.25. The local modifier is 0.25 × (0.16 lord profile + 0.20 SD–Prāṇa relationship + 0.05 PD–Prāṇa relationship), using the selected dimension's existing chart-specific profiles and relationship map. A raw-band crossing can change the displayed parent's support by at most one band, in the modifier's direction. These are computational weights, not classical percentages or empirically calibrated probabilities.

Intensity remains separate: 90% parent intensity plus 10% lord-domain activation. Prāṇa does not invent a fresh ephemeris, exact contact, or volatility reading. Its source SD midpoint evidence is labeled as inherited in the calculation disclosure. Existing SD and PD scores are not recomputed from generated children.

The Current branch action follows exact SD/Prāṇa boundaries. Manual selection turns off following. The dimension selector recalculates the visible branch. PD/SD popups share native-axis helpers through `window.AtlasNativeAxes`; this repairs the inaccessible-helper regression introduced when volatility helpers were scoped to the native-engine script.

Validation: `tests/mercury_dynamic_zoom.cjs` covers all 6,561 child intervals and 65,610 domain results, exact coverage, half-open boundaries, bounded support, parent immutability, current following, manual browsing, keyboard navigation, mobile fit, and popup entry in Chrome/WebKit. Existing Sūkṣma and current-period suites protect the original models and interactions.
