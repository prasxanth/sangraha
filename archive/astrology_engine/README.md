# Astrology engine archive

The engine is archived here. The root-level `astrology_engine.html` has been removed; open the snapshot below to use the preserved app.

| Snapshot | Source commit | Contents |
| --- | --- | --- |
| [2026-09-22 · Calibrated v5](2026-09-22_calibrated_v5.html) | `b5693f4` | Complete HTML, embedded calibration dataset, and saved optimizer result. |

Snapshot SHA-256: `5d2dc9f98a8d6f182ef25f0d4c95a44055d844aeb83d3f4e001966f5e034b7c6`.

This is a byte-for-byte file snapshot. Browser-local profile edits and calibration results are not included; export those separately from the Calibration tab if needed.

## Historical tests

The 17 engine test and oracle files are preserved unchanged in [tests/](tests/). They cover successive engine versions and are no longer part of the active root-level test suite. Some expectations apply to earlier versions rather than the final archived snapshot.

These scripts retain their original runtime assumptions, including a root-level `astrology_engine.html`, repository-root working directory, local Chrome/Playwright, and (for oracle audits) Python ephemeris dependencies. To reproduce a historical test, use a separate checkout of its corresponding engine revision; moving these files does not make every historical test compatible with the final snapshot. The Python oracle remains beside the audit scripts that reference it.

The active Mercury Life Atlas tests remain in the repository’s root [tests/](../../tests/) directory.
