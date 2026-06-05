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

test('site copy buttons write absolute share URLs', async t => {
  const listeners = new Map();
  const elements = {};
  const ids = [
    "workspace",
    "sourceInput",
    "previewCanvas",
    "previewMeta",
    "console",
    "darkModeInput",
    "plainErrorsInput",
    "diagramButton",
    "editorButton",
    "resetButton",
    "copyButton",
    "copyCanvasButton",
    "downloadButton",
  ];

  function createElement(id) {
    return {
      id,
      checked: false,
      disabled: false,
      hidden: false,
      innerHTML: "",
      textContent: "",
      value: "",
      classList: {
        toggle() {},
      },
      addEventListener(type, listener) {
        listeners.set(`${id}:${type}`, listener);
      },
    };
  }

  for (const id of ids) {
    elements[id] = createElement(id);
  }

  let clipboardText = "";
  const context = {
    Blob,
    Buffer,
    CompressionStream: undefined,
    DecompressionStream: undefined,
    Response,
    TextDecoder,
    TextEncoder,
    URL,
    URLSearchParams,
    addEventListener() {},
    atob(value) {
      return Buffer.from(value, "base64").toString("binary");
    },
    btoa(value) {
      return Buffer.from(value, "binary").toString("base64");
    },
    clearTimeout,
    console,
    document: {
      body: {
        classList: {
          toggle() {},
        },
      },
      getElementById(id) {
        return elements[id];
      },
    },
    history: {
      replaceState(_state, _title, url) {
        const nextUrl = new URL(url, context.location.href);
        context.location.href = nextUrl.href;
        context.location.pathname = nextUrl.pathname;
        context.location.search = nextUrl.search;
      },
    },
    location: {
      href: "https://example.test/pikchr-js/",
      pathname: "/pikchr-js/",
      search: "",
    },
    navigator: {
      clipboard: {
        writeText(value) {
          clipboardText = value;
          return Promise.resolve();
        },
      },
    },
    setTimeout,
  };
  context.globalThis = context;
  context.window = context;
  context.loadPikchr = async () => ({
    flags: {
      DARK_MODE: 2,
      PLAINTEXT_ERRORS: 1,
    },
    render() {
      return {
        svg: "<svg></svg>",
        width: 1,
        height: 1,
      };
    },
  });

  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  vm.runInNewContext(fs.readFileSync("site/app.js", "utf8"), context);
  await flush();

  elements.sourceInput.value = "box";
  listeners.get("copyButton:click")();
  await flush();

  t.regex(clipboardText, /^https:\/\/example\.test\/pikchr-js\/\?source=/);

  listeners.get("copyCanvasButton:click")();
  await flush();

  const canvasUrl = new URL(clipboardText);
  t.is(canvasUrl.origin, "https://example.test");
  t.is(canvasUrl.pathname, "/pikchr-js/");
  t.is(canvasUrl.searchParams.get("view"), "canvas");
});
