#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const loadPikchr = require("../index.js");

const flagAliases = {
  DARK_MODE: 0x0002,
};

function printUsage() {
  console.log("Usage: pikchr [options] ?INFILE? ?OUTFILE?");
  console.log();
  console.log("Accepts a pikchr script as input and outputs rendered SVG.");
  console.log("INFILE and OUTFILE default to stdin and stdout.");
  console.log('The special filename "-" is also accepted for stdin/stdout.');
  console.log();
  console.log("Options:");
  console.log("  -h, -?          Show this help text.");
  console.log("  -dark           Use dark-mode colors.");
  console.log("  -div            Add a wrapper div around the rendered SVG.");
  console.log("  -div-indent     Indent the wrapper.");
  console.log("  -div-center     Center the wrapper.");
  console.log("  -div-left       Float the wrapper left.");
  console.log("  -div-right      Float the wrapper right.");
  console.log("  -div-toggle     Add toggle class on the wrapper.");
  console.log("  -div-source     Add source view and set source class on wrapper.");
  console.log("  -src            Include source as a separate element next to SVG.");
  console.log();
  console.log("Examples:");
  console.log("  npx pikchr-js diagram.pikchr");
  console.log("  bunx pikchr-js -dark -div-center diagram.pikchr diagram.svg");
  console.log("  echo \"box\" | npx pikchr-js > diagram.svg");
  console.log("  npx pikchr-js -src -div diagram.pikchr -");
}

function parseFlags(raw) {
  if (raw == null) {
    return 0;
  }

  return raw
    .split(/[,+]/)
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean)
    .reduce((value, name) => {
      const flag = flagAliases[name];
      if (!Number.isInteger(flag)) {
        throw new Error(`Unknown flag: ${name}`);
      }
      return value | flag;
    }, 0);
}

function escapeHtml(raw) {
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function applyDivOutput(svg, width, markup, options) {
  const source = options.src || options.divSource
    ? `<pre class="pikchr-src" style="display:none">${escapeHtml(markup)}</pre>`
    : "";
  if (!options.div && !options.divSource) {
    return `${svg}${source}`;
  }

  const outerClasses = ["pikchr"];
  if (options.layout === "indent") outerClasses.push("indent");
  if (options.layout === "center") outerClasses.push("center");
  if (options.layout === "left") outerClasses.push("float-left");
  if (options.layout === "right") outerClasses.push("float-right");
  if (options.divToggle) outerClasses.push("toggle");
  if (options.divSource) outerClasses.push("source");

  return [
    `<div class="${outerClasses.join(" ")}">`,
    `<div class="pikchr-svg" style="max-width:${width}px;display:inline-block">${svg}</div>`,
    source,
    `</div>`,
  ].join("");
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    flags: 0,
    div: false,
    divSource: false,
    divToggle: false,
    src: false,
    layout: null,
    help: false,
    inputFile: null,
    outputFile: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "-h" || arg === "-?") {
      options.help = true;
      continue;
    }

    if (arg === "-dark") {
      options.flags |= parseFlags("DARK_MODE");
      continue;
    }

    if (arg === "-src") {
      options.src = true;
      continue;
    }

    if (arg === "-div") {
      options.div = true;
      continue;
    }

    if (arg === "-div-indent") {
      if (options.layout && options.layout !== "indent") {
        throw new Error("Cannot combine -div-indent with -div-center, -div-left, or -div-right.");
      }
      options.div = true;
      options.layout = "indent";
      continue;
    }

    if (arg === "-div-center") {
      if (options.layout && options.layout !== "center") {
        throw new Error("Cannot combine -div-center with -div-indent, -div-left, or -div-right.");
      }
      options.div = true;
      options.layout = "center";
      continue;
    }

    if (arg === "-div-left") {
      if (options.layout && options.layout !== "left") {
        throw new Error("Cannot combine -div-left with -div-indent, -div-center, or -div-right.");
      }
      options.div = true;
      options.layout = "left";
      continue;
    }

    if (arg === "-div-right") {
      if (options.layout && options.layout !== "right") {
        throw new Error("Cannot combine -div-right with -div-indent, -div-center, or -div-left.");
      }
      options.div = true;
      options.layout = "right";
      continue;
    }

    if (arg === "-div-toggle") {
      options.div = true;
      options.divToggle = true;
      continue;
    }

    if (arg === "-div-source") {
      options.div = true;
      options.divSource = true;
      options.src = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.inputFile === null) {
      options.inputFile = arg;
      continue;
    }

    if (options.outputFile === null) {
      options.outputFile = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const useStdin = options.inputFile == null || options.inputFile === "-";
  let markup = useStdin ? null : fs.readFileSync(options.inputFile, "utf8");

  if (markup == null) {
    markup = await readStdin();
  }

  const normalizedMarkup = String(markup).trim();
  if (!normalizedMarkup) {
    throw new Error("No input provided. Provide markup as an argument or from stdin.");
  }

  const load = await loadPikchr();
  const result = load.render(normalizedMarkup, "pikchr", options.flags);
  let output = applyDivOutput(result.svg, result.width, normalizedMarkup, options);

  if (options.outputFile === "-" || options.outputFile == null) {
    process.stdout.write(output);
    return;
  }

  fs.writeFileSync(options.outputFile, output, "utf8");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
