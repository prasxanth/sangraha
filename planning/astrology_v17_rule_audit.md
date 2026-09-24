# v17: conditional rules and Mercury Career audit

The v16 Career model could suppress a planet’s divisional evidence when D1 domain relevance was low. It also averaged functional lordships and lacked an explicit MD–AD context. The revised shared framework addresses these problems in all 12 life domains. It does **not** encode every BPHS rule or every BNN judgment. The application now exposes that boundary directly in Cycles → Vedic methods → Rule coverage.

## Reviewed material and implementation boundary

- [BPHS English transcription](https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf): chapters 3 (planetary character), 34 (ascendant-specific qualifications), and 58 (Mercury antardashas). The Mercury chapter is numbered 60 in another edition. Friendship is directional; strength and placement qualify results. These relationships support conditional evidence, not numerical outcome probabilities.
- [R. G. Rao, Bhrigu Nandi Nadi](https://astrofoxx.wordpress.com/wp-content/uploads/2018/11/bhrigu-nandi-nadi.pdf): introductory rules, printed pp. iii–iv, and worked-chart conventions. Sign relationships, dispositors, exchange and retrograde influence inform the independent comparator. Individual narrative cases are not automatically promoted to universal rules.
- [WisdomLib Mercury chapter page](https://www.wisdomlib.org/shop/books/jyotisha/brihat-parashara-hora-shastra/doc234234.html) supplies a synopsis, not the full chapter. The pasted discussion was treated as a model critique, not an authoritative rule specification or a required ranking.
- [PyJHora](https://github.com/naturalstupid/PyJHora) was evaluated. It offers Python calculations and rule modules, but is not a drop-in exhaustive BPHS/BNN interpretation engine. No library code was copied or bundled.
- [Swiss Ephemeris](https://www.astro.com/swisseph/swephinfo_e.htm) was used independently for astronomy, with its built-in Moshier calculation option. This verifies inputs and sampling, not the validity of interpretive weights.

## Shared rules across life domains

The engine now separates ascendant-specific functional classification from natural condition; applies degree-sensitive dignity and directed natural/temporary friendship; retains dispositor chains, exchanges and incoming aspects; and records partial strength components, combustion, motion and limited debility cancellation. Nodes receive contextual agency instead of simply inheriting a benefic dispositor’s score. No nodal exaltation convention is assumed.

All 81 ordered MD–AD pairs can be assessed for each domain and profile. Relative-house cautions preserve weakness/affliction qualifications in the registered Mercury subset. Natural friendship, relative positions, actual associations and a shared dispositor contribute separately. Repeating the same lord does not create a self-association bonus.

Mercury chapter Lagna conditions and special signs are currently **evidence annotations**, not extra numerical bonuses. The subset is not a verse-complete Mercury interpretation. Other MD chapters use the general framework, not complete chapter-specific exception tables.

| Domain | Routed corroboration |
| --- | --- |
| Career, Autonomy | D10 |
| Wealth | D2 |
| Marriage, Mind | D9 |
| Family | D12 |
| Children | D7 |
| Vitality | D27 |
| Spiritual | D20 |
| Reinvention | D30 |
| Learning, Mentorship | D24 |

These modern domain groupings and their coefficients are application policy. Varga dignity uses the app’s divisional-longitude convention; fine degree subdivisions should not be mistaken for universal agreement between schools.

The BNN comparator now retains same-sign, trine, seventh, adjacent-sign, dispositor and exchange relationships. Multiple relationships are visible, but the strongest is counted once per actor. Its sign-condition calculation uses natural friendship, independently of BPHS temporary friendship, functional lordship, vargas and Vimshottari. Retrograde previous-sign influence and degree order are displayed as evidence; actual longitudes are not shifted. The significator no longer receives an automatic positive baseline. Transit non-hits stay in the denominator, preventing the previous hit-only normalization bias.

## Explicit numerical policy

For each BPHS lord/domain:

```
general = 2 × (0.20 functional + 0.20 dignity + 0.16 placement
               + 0.14 natural + 0.14 dispositor + 0.16 association)
relevance factor = 0.65 + 0.35 × domain relevance
strength factor = 0.75 + 0.25 × partial strength
support = clamp(general × relevance factor × strength factor
                + 0.35 × varga evidence, −2, +2)
```

Varga evidence is therefore independent of D1 relevance. Strength is a bounded component model, **not full Shadbala**. Relative-house evidence, average directed friendship, association and shared host form the MD–AD context. Its contribution is weighted by the existing descendant weights and a 0.35 policy coefficient. The original depth-specific transit percentages remain unchanged (MD 5% support / 20% activation; AD 8% / 25%).

No coefficients were fitted to a desired Sun/Venus/Ketu order. Support (−2 to +2) and activation (0 to 2) remain distinct. Activation is not favorable-outcome probability.

## Remaining coverage

The coverage view separates scored, partial, evidence-only and unimplemented families. Missing or incomplete modules include full Shadbala, Ashtakavarga/vedha, all avasthas, argala, all 144 lord-in-house interpretations, every yoga and alternate dasha, all chapter exceptions, and the complete BNN case/progression corpus. Planetary war is flagged without inventing a winner from longitude alone. Maraka terminology does not produce mortality predictions. The previous natal exploration and separate Mahadasha ranking model remain distinct from this period model, as labeled in the UI.

## Independent calculation audit

Reference profile: Prashanth Kumar, 13 March 1982, 22:55, Khartoum; recorded UTC offset +02:00; Lahiri, whole-sign houses. BNN is off in the combined score. Career combination weights are Vedic 45%, Western 35%, Saju 20%.

The offline app uses its existing reference natal fixture plus approximate runtime transits and linear ayanamsa. Independent Python Swiss Ephemeris 2.10.03 used Moshier, speed flags, mean node and Lahiri for the natal chart and every requested transit timestamp, replayed into the browser’s scoring functions. A separate Python lunar-mansion balance calculation reproduced the Swiss Mercury MD boundaries to within one millisecond. AD intervals also partition the MD without gaps and preserve the 120-year proportions.

Offline natal ayanamsa is 23.60441943°; Swiss is 23.60841096°. The stored offline reference Moon differs from Swiss sidereal Moon by approximately 0.00412°. Consequently Mercury MD begins **2021-02-09** offline and **2021-02-11** with Swiss, a 2.03-day shift. Existing offline reference dates were retained in this change; this audit does not relabel them as exact Swiss Lahiri dates.

BPHS uses 32 MD / up to 24 AD samples. The independent dense check uses 192 mid-bin samples per period: the maximum Career support change across the Mercury MD and its nine ADs is approximately **0.00166**. Two-decimal reporting is appropriate for these model outputs; this convergence check is for this profile/domain, not a guarantee for all charts. BNN, Western and Saju retain the selected three-sample period setting; their long-period averages are coarser. Combined scores are more provider-sensitive than BPHS support, chiefly through the Western transit component.

| Period | v16 offline BPHS | v17 offline BPHS | v17 Swiss BPHS | v17 offline activation |
| --- | ---: | ---: | ---: | ---: |
| Mercury MD overall | +0.152 | -0.104 | -0.103 | 1.544 |
| Mercury / Mercury | +0.145 | -0.103 | -0.104 | 1.481 |
| Mercury / Ketu | +0.130 | +0.024 | +0.023 | 0.908 |
| Mercury / Venus | +0.076 | +0.121 | +0.122 | 0.894 |
| Mercury / Sun | +0.537 | +0.211 | +0.212 | 1.501 |
| Mercury / Moon | +0.150 | -0.027 | -0.022 | 0.965 |
| Mercury / Mars | +0.096 | -0.208 | -0.215 | 1.231 |
| Mercury / Rahu | -0.155 | -0.150 | -0.149 | 0.883 |
| Mercury / Jupiter | +0.152 | +0.074 | +0.073 | 0.977 |
| Mercury / Saturn | +0.305 | -0.053 | -0.053 | 1.429 |

The overall revised offline score is **−0.104 support / 1.544 activation**; the default combined score is **+0.198**. Swiss replay gives **−0.103 / 1.546**, with combined **+0.248**. The dense Swiss MD support is **−0.105**. These are model indices, not probabilities. Full precision, provider-specific dates, all ADs, comparator and combined values are in [mercury_career_v17.json](mercury_career_v17.json).

Venus now receives independent D10 corroboration, while its twelfth-from-Mercury caution remains conditional on weakness. Sun retains direct career links; Mercury’s Sun association and Saturn exchange remain in the baseline. The stronger treatment of challenging functional classifications also lowers Mercury and Saturn: this was a framework correction, not a selective Venus uplift.

## Verification and reproduction

All existing v14, v15 and v16 browser regression suites pass. The v17 suite checks 3,888 domain/MD–AD assessments across four profiles, bounded results, directed friendship, dignity boundaries, independent varga evidence, qualified cautions, no self bonus, BNN separation, dasha partitions and 360px mobile coverage.

The built-in validation’s pre-existing reference devata regression remains visible; it is not weakened or relabeled as a pass. The current run confirms 66/66 chart anchors and 29/30 synthetic checks, matching the prior baseline. Independent Swiss replay is not a test of live CDN/WASM loading.

Run with Playwright available to Node, Chrome installed, and `pyswisseph` installed in the Python used for the optional independent audit:

```sh
node archive/astrology_engine/tests/astrology_v17.cjs
ORACLE_PYTHON=/path/to/python node archive/astrology_engine/tests/astrology_v17_audit.cjs
```

Set `NODE_PATH` if Playwright is installed outside the project and `CHROME_PATH` for a different Chrome location. The audit writes reproducible reports to an OS temporary directory and does not change application profiles or fixtures.
