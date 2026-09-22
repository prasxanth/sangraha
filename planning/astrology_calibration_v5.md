# Personal calibration v5

The Calibration tab imports the attached event editor, period/date precision, confidence weighting, training/holdout split, separate Support/Activation routing fitting, and constrained dasha hierarchy fitting. The complete supplied JSON is embedded in `embeddedCalibrationDataset`; it seeds only the matching reference birth profile. Other profiles keep separate event sets and fits.

## Saved optimizer output

`embeddedCalibrationResults` contains the precomputed result for the reference profile using the internal astronomical/Bazi fallback and default structural configuration. It loads without running the optimizer. Browser localStorage saves subsequent results and the cold/fitted choice by birth profile. Session memory provides a fallback if browser storage is unavailable; the UI reports that limitation and offers JSON export.

A canonical input signature covers the optimizer/model version, birth/configuration, provider identity, structural settings, events (including dates, ranges, targets, confidence and holdout assignments), fit options, and cold priors. Edits invalidate the active fit and restore the cold model. Fitting is explicit; reloads, navigation and unchanged Fit clicks reuse saved output. A different provider or configuration requires its own explicit fit. Auto-apply preference is not an optimization input. Bump `CALIBRATION_OPTIMIZER_VERSION` when changing the underlying scoring or optimizer implementation.

## Calculation consistency

Calibration samples the Prana periods containing each event date, with multiple samples for uncertain dates or ranges. Candidate hierarchy weights use the same Vedic Prana structural and transit calculations as the applied model, with isolated caches. Western/Saju values likewise use the engine's Prana metric functions. Event ranges are averaged into one observation, rather than counted as many separate events. Higher-level periods retain their existing duration-weighted integration.

Routing uses regularized simplex candidates and sparse-domain shrinkage toward specialist priors. Only training observations select parameters. The hierarchy remains parent dominant and sums to one. Yoga/Shani context remains unscored. The cold model still uses 50/30/12/6/2. These are methodological fitting choices, not classical percentages or demonstrated predictive accuracy.

## Saved fit

- 27 events: 19 training, 8 holdout.
- Normalized training RMSE: 0.6000124943 cold, 0.5251093684 fitted.
- Normalized holdout RMSE: 0.6751708438 cold, 0.6348183962 fitted.
- Fitted MD/AD/PD/Sukshma/Prana weights: 49/29/8/8/6 percent.
- The error divides support/activation residuals by 2 and confidence-weights observations.
- Auto-apply requires at least two holdout events and no worse aggregate holdout RMSE. Without sufficient holdout data, the fit stays provisional and is not automatically applied.

Holdout improvement checks this supplied historical dataset; it does not establish predictive validity. The embedded result is provider-specific and is not reused for Swiss Ephemeris inputs.

## Verification

`tests/astrology_calibration.cjs` covers dataset integrity, zero-computation startup/reload, explicit saved-result reuse, event/options/provider/birth invalidation, stale-model rejection, manual routing transitions, Prana prediction/application equivalence, holdout exclusion, date validation, provisional fits, browser-storage failure and mobile page width. Existing cold regression fixtures explicitly select the cold model, since the matching reference profile now defaults to the validated saved fit.

The routing suite passed 10,872 checks. The duration arithmetic suite passed 87,564 checks across all 6,561 Prana leaves, with maximum aggregation error 3.13e-12. Cold Mercury MD Career support remains 0.3045283084587375. JavaScript parsing and embedded JSON validation pass. Browser checks used the internal fallback providers, not live Swiss Ephemeris.
