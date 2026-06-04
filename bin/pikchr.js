#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const loadPikchr = require("../index.js");

const DARK_MODE_FLAG = 0x0002;

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
    inputFile: null,
    outputFile: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "-dark") {
      options.flags |= DARK_MODE_FLAG;
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

    if (arg === "-") {
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

  const useStdin = options.inputFile == null || options.inputFile === "-";
  let markup = useStdin ? null : fs.readFileSync(options.inputFile, "utf8");

  if (markup == null) {
    markup = await readStdin();
  }
  const markupText = String(markup);

  const load = await loadPikchr();
  const result = load.render(markupText, "pikchr", options.flags);
  let output = applyDivOutput(result.svg, result.width, markupText, options);

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
