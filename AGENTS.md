# Repository instructions: synchronize without losing user data

These instructions apply to this entire checkout and to copies cloned from GitHub. Follow them before every editing session and again before publishing. A local file, a downloaded HTML file, and GitHub can each contain unique changes; a newer timestamp does not make any one of them authoritative.

## Before editing

1. Inspect the current branch, upstream, `git status --short`, and both staged and unstaged diffs. Identify existing user changes and concurrent work. Do not stage, stash, revert, or otherwise modify unrelated work.
2. Fetch the upstream branch, then compare it with the local branch. Pull with `git pull --ff-only` when safe. For this repository, the normal upstream is `origin/main`; do not switch branches or replace another branch's work blindly.
3. Preserve local changes before any operation that could replace them. For affected HTML/data files, keep a byte-for-byte, uniquely named backup (including embedded metadata and its baseline) in `archive/` or another recoverable local location. Preserve relevant downloaded copies supplied by the user too. Never overwrite an existing backup or commit credentials.
4. If local changes prevent a pull, or the branches diverge, reconcile them using a preserved copy or an isolated worktree. Do not discard local changes just to make a pull succeed. If GitHub cannot be reached, stop dependent edits and publication until freshness can be verified; do not assume the offline copy is current.
5. Work from the reconciled latest version. Preserve all unrelated content and metadata while making the requested change. Never restore a whole stale HTML file over a newer file merely to reuse its layout or code.

## Preserve metadata from both locations

- Treat browser-edited or downloaded HTML as user data, not a disposable build artifact. Git status cannot see unsaved browser edits or files outside the checkout. If the task mentions such changes, obtain the saved/exported copy or confirm they have been published before replacing the affected file. Do not claim these unseen changes are backed up or synchronized.
- Reconcile metadata at the record and field level against a common baseline when available. Retain one-sided edits, retain identical edits made on both sides, and combine edits to different fields. Handle additions and deletions explicitly. Do not silently choose a side when both changed the same field differently, or when record identity is ambiguous: preserve both versions and ask the user to resolve that specific conflict.
- Never regenerate the current metadata from an older CSV, archive, fixture, or cached copy. If an import is requested, compare it with the latest data and preserve newer changes unless the user explicitly authorizes their replacement.
- Verify that the requested code/design change did not alter metadata. For an intentional metadata change, verify that only the intended records and fields changed and that the saved file reopens with those values.

## Before committing and pushing

1. Fetch again and compare the upstream with the version used for the work. GitHub may have received browser metadata commits during the session. Reconcile any new changes and repeat affected validation before publishing.
2. Review the final diff and stage only task-owned files. Keep unrelated staged/unstaged changes and concurrent work intact. Run the relevant checks required by the affected directory's instructions.
3. Push normally. Never force-push, use `reset --hard`, use `clean`, or resolve a data conflict with blanket `ours`/`theirs` to bypass synchronization. A rejected push means fetch, preserve, reconcile, validate, and retry; it does not authorize overwriting GitHub.
4. Verify the pushed commit is present on the upstream branch. Report whether changes are local only, saved to a file, or committed and pushed; these are different states. Keep recovery copies until reconciliation and persistence have been verified.

See `books/AGENTS.md` for Marginalia-specific persistence rules.

## Life Atlas journal persistence

`mercury_atlas.html` stores published journal entries in the `journalData` JSON block and their common ancestor in `journalBaseline`. The browser keeps device edits and a baseline together in `lifeAtlasJournalState`; the older `lifeAtlasOutcomeJournalV4` array is a compatibility copy. A local outcome save is not a GitHub commit. The browser's **Save to GitHub** action reviews changes, fetches the latest HTML again, writes only the two journal blocks with a matching Git blob SHA, and verifies the returned commit. Local recording and JSON backups remain available offline.

- Before any Atlas code/design edit, fetch upstream and preserve the current HTML and supplied exported copies byte-for-byte. Compare both journal blocks in local, upstream and supplied copies. Browser-only edits are not visible to Git; obtain a saved/exported copy if the task mentions unpublished journal data.
- Match journal records by immutable `id`. Reconcile additions, deletions and individual fields against the saved baseline. Preserve unknown fields and frozen `snapshot` values. Do not regenerate observations or snapshots from current calculations, fixtures or older HTML. Conflicting edits, same-ID additions and delete-versus-edit conflicts require an explicit choice; preserve both versions until resolved.
- A downloaded HTML may be older than device storage. Never treat its missing entries as fresh remote deletions. Legacy device arrays have no verified common ancestor; do not invent one. Keep them until they can be reconciled with a fresh GitHub read. Keep entries and their baseline together in exported JSON and device state.
- For code-only work, require parsed equality of both journal blocks before and after editing. Fetch again before publishing, reconcile browser commits received during the session, then repeat affected checks. Preserve the latest upstream app code when committing journal data; never publish a serialized/stale browser DOM.
- Retain review-before-publish, fresh remote checks, field-level conflict choices, SHA-guarded writes, error recovery and commit verification. Never retry a rejected write by dropping the SHA or forcing an overwrite. Do not remove the repository-visibility acknowledgment.
- Never embed or log a GitHub token in HTML, JSON exports, commits or tests. Atlas credentials are dialog-scoped and cleared on close/success; do not persist them. Only mocked network responses and placeholder tokens may be used in tests. Do not publish real journal entries as a test.
- Run `tests/mercury_guidance_journal.cjs` and `tests/mercury_journal_github.cjs` for journal changes. Run `tests/mercury_iphone_ux.cjs` (Chrome and WebKit) for reference-navigation/form changes. Preserve the existing model checks for changes that affect calculation or data presentation.

These rules adapt the reconciliation safeguards in `books/AGENTS.md`; book metadata and Atlas journals remain separate datasets.
