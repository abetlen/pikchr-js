"use strict";

const Module = require("./pikchr.js");

module.exports = function () {
  return Module().then((module) => {
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
    return pikchr;
  });
};
