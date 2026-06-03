"use strict";

const Module = require("./pikchr.js");

module.exports = function () {
  return Module().then((module) => (markup, svgClass = "pikchr", flags = 0) => {
    const cstring = module.ccall(
      "pikchr",
      "number",
      ["string", "string", "number", "number", "number"],
      [markup, svgClass, flags, 0, 0]
    );
    if (!cstring) {
      throw new Error("pikchr returned NULL");
    }
    try {
      return module.UTF8ToString(cstring);
    } finally {
      module._free(cstring);
    }
  });
};
