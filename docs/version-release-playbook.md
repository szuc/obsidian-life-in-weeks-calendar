# Release Procedure

## 1. Verify the build

```bash
npm test
npm run lint
```

## 2. Bump the version and generate the tag

Run `npm version` with your desired semver increment (`patch`, `minor`, `major`) or an explicit version number (e.g. `1.0.13`):

```bash
npm version patch
# Or: npm version minor
# Or: npm version 1.0.13
```

### What happens behind the scenes:

1. `package.json` and `package-lock.json` versions are updated.
2. The `"version"` script executes `version-bump.mjs`, which syncs the new version into `manifest.json` and registers it in `versions.json`.
3. The changes are staged and committed automatically.
4. A git tag is created **without a leading `v`** (configured via `tag-version-prefix=""` in `.npmrc` to comply with Obsidian community plugin standards).

## 3. Push commits and tags to GitHub

Push your branch along with the newly created tag:

```bash
git push origin main && git push origin --tags
```

_(Alternatively: `git push origin main --follow-tags`)_

### Automated GitHub Actions workflow

Pushing the tag triggers the `.github/workflows/release.yml` workflow, which will:

1. Build the production bundle (`npm run build`).
2. Generate build provenance attestations.
3. Create a **Draft Release** on GitHub with `main.js`, `manifest.json`, and `styles.css` attached.

## 5. Publish the release

1. Navigate to your repository's **Releases** page on GitHub.
2. Edit the generated draft release to add your release notes/changelog.
3. Click **Publish release**.
