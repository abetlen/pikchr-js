# Pikchr.js - Generate pikchr diagrams in the browser

What is Pikchr? From the [official documentation](https://pikchr.org/home/doc/trunk/homepage.md):

> Pikchr (pronounced "picture") is a [PIC](https://en.wikipedia.org/wiki/Pic_language)-like markup language for diagrams in technical documentation.

`Pikchr.js` allows you to turn Pikchr markup into svg diagrams directly in your browser.

# Contributing

## Updating `pikchr.js`

1. Download the latest source archive of [`pikchr`](https://pikchr.org/home/rchvdwnld/trunk)
2. Extract the archive outside this repository
3. In the extracted `pikchr` source directory, run `make pikchr.c`
4. Copy the generated `pikchr.c` into this repository
5. Run `npm run build` to regenerate `pikchr.js` with the Dockerized Emscripten build
6. Run `npm test`

If upstream Pikchr changes its SVG output, update the test fixture in `test.js` to match the new generated output.
