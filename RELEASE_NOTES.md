# Release Notes — Cleanup: remove node_modules from history

Date: 2026-01-02

Summary:
- Removed committed `node_modules` directories from repository history.
- Added a root `.gitignore` to prevent committing dependencies.
- Performed history rewrite and garbage collection to reduce repository size.
- Pushed cleaned history to `origin/main` and created tag `cleanup/remove-node_modules-2026-01-02`.

Impact:
- This is a destructive history rewrite (force push performed) — collaborators should re-clone or reset their local copies:

  1. Backup any uncommitted local changes.
  2. `git fetch origin`
  3. `git checkout main`
  4. `git reset --hard origin/main`

Notes:
- Node modules are now untracked; to install dependencies locally run `npm install` in `backend` and `frontend` as needed.
- If you want the repo further reduced, we can run additional history pruning or use BFG for deeper cleanup.

Files changed:
- Added `.gitignore`
- Added `RELEASE_NOTES.md` (this file)
- Updated repository history (node_modules removed)

Tag created: `cleanup/remove-node_modules-2026-01-02`

---

If you'd like, I can also draft a GitHub release body or open a PR for this notes file — tell me whether to publish a release or open a PR now.