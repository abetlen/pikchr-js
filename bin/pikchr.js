#!/usr/bin/env bun

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const loadPikchr = require("../index.js");

const flagAliases = {
  PLAINTEXT_ERRORS: 0x0001,
  PLAINTEXT_ERRORS_ONLY: 0x0001,
  DARK_MODE: 0x0002,
};

function printUsage() {
  console.log("Usage: pikchr [options] [markup]");
  console.log();
  console.log("Reads markup from the first positional argument or stdin.");
  console.log("If --input is provided, that file is used for markup.");
  console.log();
  console.log("Options:");
  console.log("  -h, --help                  Show this help text.");
  console.log("  -v, --version               Print package version.");
  console.log("  -c, --class <name>          Set SVG class name (default: pikchr).");
  console.log("  -f, --flags <flags>         Pass pikchr flags as number or CSV of names.");
  console.log("  -i, --input <file>          Read pikchr markup from file.");
  console.log("  -o, --output <file>         Write output to file instead of stdout.");
  console.log();
  console.log("Examples:");
  console.log('  bunx pikchr-js "box"');
  console.log('  bunx pikchr-js --flags dark_mode "box -> dot"');
  console.log("  bunx pikchr-js -i diagram.pikchr -o diagram.svg");
  console.log('  echo "box" | bunx pikchr-js');
}

function parseFlags(raw) {
  if (raw == null) {
    return 0;
  }

  if (/^0x/i.test(raw)) {
    return Number.parseInt(raw, 16);
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  return raw
    .split(/[,+]/)
    .map((entry) => entry.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_"))
    .filter(Boolean)
    .reduce((value, name) => {
      const flag = flagAliases[name];
      if (!Number.isInteger(flag)) {
        throw new Error(`Unknown flag: ${name}`);
      }
      return value | flag;
    }, 0);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    className: "pikchr",
    flags: 0,
    inputFile: null,
    outputFile: null,
    markup: null,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "-v" || arg === "--version") {
      options.version = true;
      continue;
    }

    if (arg === "-c" || arg === "--class") {
      if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
        throw new Error("--class requires a value.");
      }
      options.className = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "-f" || arg === "--flags") {
      if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
        throw new Error("--flags requires a value.");
      }
      options.flags = parseFlags(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg === "-i" || arg === "--input") {
      if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
        throw new Error("--input requires a file path.");
      }
      options.inputFile = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "-o" || arg === "--output") {
      if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
        throw new Error("--output requires a file path.");
      }
      options.outputFile = args[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith("--class=")) {
      options.className = arg.slice("--class=".length);
      continue;
    }

    if (arg.startsWith("--flags=")) {
      options.flags = parseFlags(arg.slice("--flags=".length));
      continue;
    }

    if (arg.startsWith("--input=")) {
      options.inputFile = arg.slice("--input=".length);
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputFile = arg.slice("--output=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (options.markup !== null) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    options.markup = arg;
  }

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (options.version) {
    const packagePath = path.resolve(__dirname, "..", "package.json");
    const { version } = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    console.log(version);
    process.exit(0);
  }

  let markup = options.inputFile
    ? fs.readFileSync(options.inputFile, "utf8")
    : options.markup;

  if (markup == null) {
    if (process.stdin.isTTY) {
      printUsage();
      throw new Error("No input provided. Provide markup as an argument or from stdin.");
    }
    markup = await readStdin();
  }

  const normalizedMarkup = String(markup).trim();
  if (!normalizedMarkup) {
    throw new Error("No input provided. Provide markup as an argument or from stdin.");
  }

  const load = await loadPikchr();
  const output = load(normalizedMarkup, options.className, options.flags);

  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, output, "utf8");
    return;
  }

  process.stdout.write(output);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
