# Pikchr.js - Generate pikchr diagrams in the browser

[![CI](https://github.com/abetlen/pikchr-js/actions/workflows/ci.yml/badge.svg)](https://github.com/abetlen/pikchr-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pikchr-js.svg)](https://www.npmjs.com/package/pikchr-js)
[![npm downloads](https://img.shields.io/npm/dm/pikchr-js.svg)](https://www.npmjs.com/package/pikchr-js)
[![license](https://img.shields.io/npm/l/pikchr-js.svg)](LICENSE)

Try the browser editor at [abetlen.github.io/pikchr-js](https://abetlen.github.io/pikchr-js/).

What is Pikchr? From the [official documentation](https://pikchr.org/home/doc/trunk/homepage.md):

> Pikchr (pronounced "picture") is a [PIC](https://en.wikipedia.org/wiki/Pic_language)-like markup language for diagrams in technical documentation.

`Pikchr.js` allows you to turn Pikchr markup into svg diagrams directly in your browser.

## Installation

```sh
npm install pikchr-js
```

## Usage

### Browser

```html
<div id="diagram"></div>
<script src="https://unpkg.com/pikchr-js"></script>
<script>
  async function main() {
    const pikchr = await loadPikchr();
    document.getElementById("diagram").innerHTML = pikchr("box");
  }

  main();
</script>
```

### Node.js

```js
const loadPikchr = require("pikchr-js");

async function main() {
  const pikchr = await loadPikchr();
  const svg = pikchr("box");
  const result = pikchr.render("box");
  const darkSvg = pikchr("box", "pikchr", pikchr.flags.DARK_MODE);

  console.log(svg);
  console.log(result.width, result.height);
  console.log(darkSvg);
}

main();
```

### Command Line

Run the bundled `pikchr` binary via `npx` or `bunx`.

```sh
npx pikchr-js -div-center diagram.pikchr diagram.svg
```

```sh
bunx pikchr-js -dark diagram.pikchr > diagram.svg
```

```sh
echo "box" | npx pikchr-js -src -div - > diagram.svg
```

The CLI syntax is identical to upstream `pikchr`: `pikchr [options] ?INFILE? ?OUTFILE?`.
Supported options are `-dark`, `-src`, `-div`, `-div-indent`, `-div-center`, `-div-left`, `-div-right`, `-div-toggle`, and `-div-source`.
Input and output filenames default to stdin and stdout, and `-` can be used to force either side.

## Example

This Pikchr source:

```pikchr
box "Pikchr" fit fill white
arrow
box "SVG" fit fill white
```

renders as:

![Pikchr example diagram](examples/pikchr-to-svg.svg)

See the [Pikchr user manual](https://pikchr.org/home/doc/trunk/doc/userman.md) for the full markup reference.

## Contributing

### Pull request titles and changelog entries

Use pull request titles in the form `<tag>: <title>`, with an optional scope when it adds clarity.

Prefer tags such as `feat`, `fix`, `chore`, `ci`, `docs`, and `refactor`.

Add changelog entries under `## [Unreleased]` using the pull request title followed by `by @contributor in #1234`.

```md
- feat: add support for X by @contributor in #1234
- fix(ci): repair Y build by @contributor in #1234
```

### Publishing to npm

This repository publishes npm releases from the `publish.yml` GitHub Actions workflow when a GitHub Release is published.

Configure npm Trusted Publishing for `pikchr-js` before publishing a release.

Use these values in the npm package settings:

- Publisher: GitHub Actions
- Organization or user: `abetlen`
- Repository: `pikchr-js`
- Workflow filename: `publish.yml`
- Environment name: `npm-publish`
- Allowed action: `npm publish`

Create a GitHub environment named `npm-publish` and add required reviewers if you want manual approval before npm receives the OIDC publish request.

Trusted Publishing requires GitHub-hosted runners, and the workflow uses Node.js 24 so the npm CLI supports OIDC authentication.

For each release, merge a release PR that updates `package.json`, `package-lock.json`, and `CHANGELOG.md`, then create and publish a GitHub Release whose tag exactly matches the package version in `vX.Y.Z` form.

The publish workflow verifies the tag against `package.json`, installs dependencies without a package-manager cache, runs tests, checks the tarball contents, and runs `npm publish` without an `NPM_TOKEN` secret.

### Updating the GitHub Pages site

The static browser editor lives in `site/`.

Run `npm run site:build` to build the `_site/` artifact locally.

The `pages.yml` workflow deploys the built site from pushes to `main`.

You can also deep-link directly into the editor:

```text
https://abetlen.github.io/pikchr-js/?source=<encoded-source>
https://abetlen.github.io/pikchr-js/?sourcez=<compressed-source>
https://abetlen.github.io/pikchr-js/?view=canvas&source=<encoded-source>
```

`view=diagram` opens canvas-only mode, as before. `view=canvas` is a new alias for the same canvas-only
view and is only surfaced by the **Copy Canvas Link** button.
If the editor is currently in Diagram mode, use the **Copy Canvas Link** button to copy the same source
with the canvas-only `view=canvas` URL.

New links default to `sourcez` for compactness; `source` remains accepted for backward compatibility.

When supported, the editor prefers the `sourcez` parameter for compressed source payloads and falls back to `source`.

### Updating `pikchr.js`

1. Download the latest source archive of [`pikchr`](https://pikchr.org/home/rchvdwnld/trunk)
2. Extract the archive outside this repository
3. In the extracted `pikchr` source directory, run `make pikchr.c`
4. Copy the generated `pikchr.c` into this repository
5. Run `npm run build` to regenerate `pikchr.js` with the pinned Dockerized Emscripten 5.0.7 build
6. Run `npm test`

The Docker image is pinned so regenerated wasm output does not drift when new Emscripten releases are published.

If upstream Pikchr changes its SVG output, update the test fixture in `test.js` to match the new generated output.

## License

This project is licensed under the [0BSD license](LICENSE).
