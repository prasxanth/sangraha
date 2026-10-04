# Book library updates

Before modifying book files locally, fetch and pull the latest GitHub branch (`git pull --ff-only`). Preserve any local edits; if the pull cannot be completed or conflicts with local changes, stop and reconcile them before editing. Do not update the library from a stale offline checkout.

Marginalia stores its library in the HTML's `embeddedData` JSON block. Metadata edited in the browser must be saved/downloaded into `books/marginalia.html` and committed to publish it. Browser edits fetch the GitHub source before editing and again before saving; do not remove that freshness check. Keep the `metadata-baseline` block in exported files so uncommitted metadata can be compared safely with GitHub on reopening.

Run `tests/marginalia.cjs` and `tests/marginalia_metadata.cjs` when changing Marginalia. Use mocked network responses for repeatable checks.
