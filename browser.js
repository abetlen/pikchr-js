"use strict";

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    const loadPikchr = factory(() => require("./pikchr.js"));
    module.exports = loadPikchr;
    module.exports.default = loadPikchr;
  } else {
    root.loadPikchr = factory(() => root.Module);
  }
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof self !== "undefined"
    ? self
    : this,
  function (getModuleFactory) {
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

    return function loadPikchr() {
      const createModule = getModuleFactory();
      if (typeof createModule !== "function") {
        return Promise.reject(new Error("pikchr.js must be loaded before loadPikchr()"));
      }
      return Promise.resolve(createModule()).then(createPikchr);
    };
  }
);
