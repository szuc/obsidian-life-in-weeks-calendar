# Release Procedure

## 1. Verify the build

```bash
npm run test
npm run lint
```

## 2. Bump the version

Update the version in `package.json` with your desired semver increment then `run npm version`.

### What happens behind the scenes:

1. The `"version"` script executes `version-bump.mjs`, which syncs the new version into `manifest.json` and registers it in `versions.json`.
2. The changes are staged automatically.

## Create a git tag

`git tag -a 1.0.13 -m "1.0.13"`

A git tag is created **without a leading `v`** to comply with Obsidian community plugin standards. See https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions.

## 3. Push commits and tags to GitHub

Push your branch along with the newly created tag:

```bash
git push origin main
git push origin --tags
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
