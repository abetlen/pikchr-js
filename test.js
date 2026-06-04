const loadPikchr = require('./index.js');
const fs = require('fs');
const test = require('ava');
const vm = require('vm');
const { execFileSync } = require('node:child_process');

const markup = `box`
const expected = `\
<svg xmlns='http://www.w3.org/2000/svg' style='font-size:initial;' class="pikchr" viewBox="0 0 112.32 76.32" data-pikchr-date="20260403102956">
<path d="M2.16,74.16L110.16,74.16L110.16,2.16L2.16,2.16Z"  style="fill:none;stroke-width:2.16;stroke:rgb(0,0,0);" />
</svg>
`

test('simple', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr(markup)
	t.is(output, expected);
});

test('legacy dimension arguments are accepted', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr(markup, "pikchr", 0, 1, 1)
	t.is(output, expected);
});

test('render returns svg dimensions', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr.render(markup)
	t.deepEqual(output, {
    svg: expected,
    width: 112,
    height: 76,
  });
});

test('flags expose upstream bit values', async t => {
  const pikchr = await loadPikchr()
	t.deepEqual(pikchr.flags, {
    PLAINTEXT_ERRORS: 1,
    DARK_MODE: 2,
  });
});

test('flags can be passed to render', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr.render(markup, "pikchr", pikchr.flags.DARK_MODE)
	t.true(output.svg.includes('stroke:rgb(255,255,255);'));
  t.is(output.width, 112);
  t.is(output.height, 76);
});

test('pikchr.js require still returns raw Emscripten module', async t => {
  const createModule = require('./pikchr.js');
  const module = await createModule();
  t.is(typeof module.ccall, 'function');
  t.is(module.render, undefined);
});

test('pikchr.js exposes browser loadPikchr without Node globals', async t => {
  const context = {
    console,
    document: { currentScript: { src: 'https://example.test/pikchr.js' } },
    TextDecoder,
    TextEncoder,
    WebAssembly,
  };
  context.globalThis = context;
  context.window = context;

  vm.runInNewContext(fs.readFileSync('pikchr.js', 'utf8'), context);

  t.is(typeof context.Module, 'function');
  t.is(typeof context.loadPikchr, 'function');
  const pikchr = await context.loadPikchr();
  t.is(pikchr(markup), expected);
  t.deepEqual(pikchr.render(markup), {
    svg: expected,
    width: 112,
    height: 76,
  });
});

test('package root uses pikchr.js for UNPKG', t => {
  const pkg = require('./package.json');
  t.is(pkg.unpkg, './pikchr.js');
  t.is(pkg.exports['.'].unpkg, './pikchr.js');
});

test('cli accepts "-" for output file and stdin', t => {
  const output = execFileSync("node", ["bin/pikchr.js", "-src", "-div", "-"], {
    input: "box",
    encoding: "utf8",
  });

  t.true(output.includes('<div class="pikchr">'));
  t.true(output.includes("pikchr-src"));
  t.true(output.includes("<svg"));
});
