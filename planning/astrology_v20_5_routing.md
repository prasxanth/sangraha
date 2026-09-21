# v20.5 domain- and metric-specific routing

Integrated the routing delta from the supplied v20.5 HTML. Specialist routing is the default. Support already had domain-specific weights in this repository; this update revises those weights and introduces a distinct Activation matrix.

The Playbook routing panel exposes Specialist, Equal comparison and Custom/API modes, with separate Support / Activation percentages for every selected top-level channel. Percentages describe methodological emphasis, not empirical accuracy. On mobile, each cell stacks Support above Activation and the three default channels fit the screen.

## Default matrices

Numbers are Vedic / Western / Saju percentages before renormalizing the selected, covered channels.

| Domain | Support | Activation |
| --- | --- | --- |
| Career | 45 / 20 / 35 | 50 / 30 / 20 |
| Wealth | 45 / 15 / 40 | 45 / 25 / 30 |
| Marriage | 40 / 40 / 20 | 40 / 40 / 20 |
| Family | 40 / 35 / 25 | 40 / 40 / 20 |
| Children | 55 / 25 / 20 | 50 / 30 / 20 |
| Vitality | 35 / 25 / 40 | 35 / 35 / 30 |
| Mind | 25 / 55 / 20 | 25 / 60 / 15 |
| Spiritual | 60 / 25 / 15 | 55 / 30 / 15 |
| Reinvention | 20 / 45 / 35 | 25 / 45 / 30 |
| Learning | 35 / 35 / 30 | 35 / 40 / 25 |
| Autonomy | 30 / 40 / 30 | 30 / 45 / 25 |
| Mentorship | 40 / 35 / 25 | 40 / 40 / 20 |

Renormalization is independent for Support and Activation, so a provider missing Activation does not dilute other Activation providers. The table displays configured routing for the selected channels; per-sample coverage can further renormalize the actual calculation. Existing all-missing behavior is retained: Support falls back to zero and Activation remains unavailable.

## BNN channel

BNN remains off by default. With BPHS selected, its contribution is `85% BPHS + 15% BNN` inside the Vedic channel for both metrics, before domain routing. There is no fourth top-level vote. Without BPHS, BNN substitutes for the Vedic channel. If one internal provider lacks coverage, the available provider supplies the channel rather than inventing a zero-valued contribution.

Raw BPHS/BNN method-comparison scores remain separate. Scale stays the existing BPHS expression index. Agreement excludes the internal BNN vote and zero-weight channels.

## Modes and API

- Specialist uses the fixed imported matrices.
- Equal comparison assigns equal weights to selected top-level channels with coverage; BPHS+BNN remains one channel.
- Custom/API uses separate editable Support and Activation matrices. Switching away preserves edits; returning to Specialist restores its fixed defaults. Edits are validated atomically and cannot assign BNN an extra top-level vote. Additional registered providers opt into Custom/API routing with independent support/activation target shares.

```js
AstroHeatmap.getSystemRouting();
AstroHeatmap.setSystemRoutingMode('equal');
AstroHeatmap.setSystemRoutingWeights('support', {
  Career: {Vedic: 0.5, Western: 0.2, Saju: 0.3}
});
AstroHeatmap.setSystemRoutingMode('specialist');
```

Mode and custom edits are session state; profile export records the mode, policy, active matrices and custom matrices. Lifetime reference cache keys include routing mode and support policy. Routing changes reuse raw provider caches while rebuilding combined duration totals and lifetime ranks.

## Preserved

The 50/30/12/6/2 lord hierarchy, actual-duration Prana integration, raw provider calculators, Scale, Direction classifier, Support default subtab and compact Direction bar chart are unchanged. Yoga/Shani Direction context remains unscored. The attachment's scored context overlay is not imported.

## Validation and reference results

- 10,872 routing comparisons: all 12 domains, both metrics, all 15 nonempty built-in system selections, all three modes, missing coverage, instant and period paths, BNN substitution/internal blending, and atomic API rejection. Additional checks cover zero-weight consensus, mode restoration and mobile layout.
- 87,564 hierarchy/arithmetic comparisons over 6,561 Prana leaves, including real-chart BNN leaf blends and parent-duration identities. Maximum discrepancy: 3.13e-12.
- Lifetime-reference and Direction UI regressions pass, including 900 support-gate combinations.
- Source comparison confirms raw calculators, duration partition/averaging, Direction classification and compact bars are unchanged.
- All-domain MD/AD/PD audit confirms raw Vedic Support and Scale equal v20.4; individual Career system scores are also identical.

In the offline default reference configuration (Vedic + Western + Saju, BNN off), Mercury MD Career combined Support changes from +0.259078 to **+0.304528**. Vedic-only remains +0.014937. Within Mercury/Venus, Mercury PD is +0.389732 (ADVANCE) and Ketu PD is +0.438517 (ADVANCE). These changes are consequences of the requested routing, not newly tuned planetary scores. See the accompanying audit JSON for all domains. Other ephemeris/configuration choices can yield different values.

The pre-existing devata synthetic invariant failure remains; these tests establish implementation consistency, not predictive accuracy.
