# Paper Trails — Agent Instructions

## Post-merge publication to here.now

Whenever a PR or PR stack is merged into `main` with runtime changes (unless the user explicitly asks not to publish), publish the merged `origin/main` commit to the production here.now site as part of post-merge actions:

- **Production site:** `https://orchid-plover-v4vj.here.now/` (slug `orchid-plover-v4vj`, permanent).
- **Credentials:** Read from `HERENOW_API_KEY` or `~/.herenow/credentials`. Never commit secrets, tokens, or presigned upload URLs.
- **Allowlisted static runtime files only** (read directly from `origin/main`, matching `allowed()` in `tools/prototype/publish_prototype.py`):
  - `index.html`, `print-trail.html`, `script.js`, `style.css`
  - `src/*.js`, `vendor/*.js`, `data/*.yaml`
  - `images/**` with extensions `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.ico`, `.gif`
  - Never publish `docs/`, `tools/`, `.agents/`, `.github/`, `AGENTS.md`, git metadata, or local state.
- **Safe update & verification flow:**
  1. `git fetch origin main` and package from `origin/main`.
  2. Query `GET https://here.now/api/v1/publish/orchid-plover-v4vj` for `currentVersionId`.
  3. Update via `PUT https://here.now/api/v1/publish/orchid-plover-v4vj` with `baseVersionId: currentVersionId` and `ttlSeconds: null`.
  4. Upload the returned R2 presigned targets, then `POST` the returned `finalizeUrl` with `versionId` and confirm `success: true`, `state: "live"`, and `persistence: "permanent"`.
  5. Verify HTTP `200` on `/` and `/print-trail.html`, and confirm exact SHA-256 hash matches for the updated runtime files via `GET https://here.now/api/v1/publish/orchid-plover-v4vj/files/<path>`.
  6. If the root checkout has `.herenow/state.json`, update `publishes["orchid-plover-v4vj"].versionId` to the new version ID.

## Validation & caching

- Run the validation suite before pushing runtime changes:
  ```powershell
  node --test tools/*.test.mjs
  python -m unittest discover -s tools/prototype -p 'test_*.py'
  node tools/prototype/browser-audit.mjs
  ```
- Paper Trails is a static ES-module site with no build step; bump the `?v=...` query string in importers when modifying `script.js` or `src/*.js` so browsers do not serve stale cached modules.
