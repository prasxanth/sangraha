# Scale / reach display

The third map in Cycles adapts the Scale / reach presentation from `dynamic_astrology_engine_latest_v17.html`. Its scoring source is the existing duration-weighted expression model, as requested; the attachment's alternative scoring engine and other changes are not imported.

`scalePeriod(period, domain) = domainExpressionAssessment(period, domain)[1].score`

Career therefore displays **Authority / scale**. Other domains display their existing second facet, explicitly named in the domain key and cell details. These facets are not interchangeable measurements of organizational size. This is a Vedic exploratory expression index, not combined-system support, activation, probability, or predicted achievement. Without Vedic selected, the map reports that requirement instead of inventing scale evidence for Western or Saju.

All original calculation functions and constants remain unchanged. The adapter inherits actual-duration weighting through MD → AD → PD → Sookshma → Prana. Support still defaults to its fixed −2…+2 semantic colors; scale uses a fixed unsigned 0–2 palette regardless of support contrast mode. No score is derived from a color.

The map expands on demand and prepares values in yielding batches. It uses the existing touch magnifier, keyboard cell navigation, per-domain Details dropdown, and Cycle Zoom navigation. The key and preview name the exact expression facet and show its existing structural/yoga/transit contributions.

Validation: `tests/astrology_scale_display.cjs` checks identity with existing scores, duration averaging across all 12 domains, unchanged support/activation, absolute defaults, mobile grid and magnifier, named details, layout overflow, and missing-Vedic behavior. AST comparison against the previous commit confirms only three existing functions changed, all renderers; the new functions are display adapters.
