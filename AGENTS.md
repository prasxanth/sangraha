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
