#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CXXFLAGS="${OPTIMIZE}"

emcc \
    ${OPTIMIZE} \
    -s SINGLE_FILE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_FUNCTIONS='["_pikchr", "_malloc", "_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "UTF8ToString", "getValue", "setValue"]' \
    -s MALLOC=emmalloc \
    -s MODULARIZE=1 \
    -s STRICT=1 \
    -o ./pikchr.js \
    pikchr.c

{
    cat ./pikchr.js
    cat <<'EOF'

;(function (root, createModule) {
  function createPikchr(module) {
    function render(markup, svgClass = "pikchr", flags = 0) {
      const widthPtr = module._malloc(4);
      const heightPtr = module._malloc(4);
      let cstring = 0;

      if (!widthPtr || !heightPtr) {
        if (widthPtr) module._free(widthPtr);
        if (heightPtr) module._free(heightPtr);
        throw new Error("failed to allocate pikchr dimension pointers");
      }

      try {
        module.setValue(widthPtr, 0, "i32");
        module.setValue(heightPtr, 0, "i32");
        cstring = module.ccall(
          "pikchr",
          "number",
          ["string", "string", "number", "number", "number"],
          [markup, svgClass, flags, widthPtr, heightPtr]
        );
        if (!cstring) {
          throw new Error("pikchr returned NULL");
        }
        return {
          svg: module.UTF8ToString(cstring),
          width: module.getValue(widthPtr, "i32"),
          height: module.getValue(heightPtr, "i32"),
        };
      } finally {
        if (cstring) module._free(cstring);
        module._free(widthPtr);
        module._free(heightPtr);
      }
    }

    const pikchr = (markup, svgClass = "pikchr", flags = 0, _height, _width) =>
      render(markup, svgClass, flags).svg;
    pikchr.render = render;
    pikchr.flags = {
      PLAINTEXT_ERRORS: 0x0001,
      DARK_MODE: 0x0002,
    };
    return pikchr;
  }

  function loadPikchr() {
    return Promise.resolve(createModule()).then(createPikchr);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = loadPikchr;
    module.exports.default = loadPikchr;
  } else {
    root.loadPikchr = loadPikchr;
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof self !== "undefined"
    ? self
    : this,
  Module
);
EOF
} > ./pikchr.browser.js
