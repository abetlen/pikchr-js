# Pikchr.js - Generate pikchr diagrams in the browser

What is Pikchr? From the [official documentation](https://pikchr.org/home/doc/trunk/homepage.md):

> Pikchr (pronounced "picture") is a [PIC](https://en.wikipedia.org/wiki/Pic_language)-like markup language for diagrams in technical documentation.

`Pikchr.js` allows you to turn Pikchr markup into svg diagrams directly in your browser.

## Installation

```sh
npm install pikchr-js
```

Use your preferred npm-compatible package manager.

## Usage

```js
const loadPikchr = require("pikchr-js");

async function main() {
  const pikchr = await loadPikchr();
  const svg = pikchr("box", "pikchr", 0, 1, 1);

  console.log(svg);
}

main();
```

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

### Updating `pikchr.js`

1. Download the latest source archive of [`pikchr`](https://pikchr.org/home/rchvdwnld/trunk)
2. Extract the archive outside this repository
3. In the extracted `pikchr` source directory, run `make pikchr.c`
4. Copy the generated `pikchr.c` into this repository
5. Run `npm run build` to regenerate `pikchr.js` with the Dockerized Emscripten build
6. Run `npm test`

If upstream Pikchr changes its SVG output, update the test fixture in `test.js` to match the new generated output.

## License

This project is licensed under the [0BSD license](LICENSE).
