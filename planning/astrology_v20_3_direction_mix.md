# Cumulative Direction mix and cycle subtabs

Imported only the cumulative bar-chart feature from `astrology_engine_v20_3_cumulative_direction_mix.html`. The attachment's timeline revisions and scored yoga/Shani overlay are not imported. Direction uses the existing v20.1 unscored-context classifier without changes.

Cycles now has four accessible subtabs: Direction, Support (default), Activation, Scale. Selection survives cycle rerenders; arrow keys and Home/End navigate the tab row. Direction contains both its heatmap and the new bar chart.

Each domain bar groups immediate child periods by their existing Direction action and sums their actual durations. Shares use the total child duration as denominator; all shares, including unavailable Direction, remain represented. All life groups MDs, MD groups ADs, AD groups PDs, PD groups Sookshma, and Sookshma groups Prana. Terminal Prana and non-Vimshottari selections show an explanatory empty state. The chart summarizes the complete selected period, not only calendar-filtered heatmap columns.

Responsive bars fit the mobile width. Small segments remain exactly proportional and have separate tappable labels, so no minimum-width distortion is needed. Tapping a segment or label reveals contributing periods, dates and raw support inline beneath the selected domain. Percentages are rounded for text only; displayed rounded percentages can sum to 99% or 101% while geometric shares total 100%.

Existing score/activation/scale, percentile and Direction classifier functions are unchanged. Browser tests cover all-domain duration conservation and bucket membership, unchanged metrics, unavailable values, terminal depth, actual segment widths, mobile overflow, subtab visibility/persistence and keyboard navigation. Scale and score-layout regression suites also pass.

Tests: `tests/astrology_direction_mix.cjs`, `tests/astrology_scale_display.cjs`, `tests/astrology_score_layout.cjs` (Playwright with local Chrome; external ephemeris requests disabled for deterministic regression).
