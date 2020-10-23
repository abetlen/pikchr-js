#!/bin/bash

set -e

export OPTIMIZE="-Os"
export LDFLAGS="${OPTIMIZE}"
export CFLAGS="${OPTIMIZE}"
export CXXFLAGS="${OPTIMIZE}"

emcc \
    ${OPTIMIZE} \
    -s SINGLE_FILE=1 \
    -s EXPORTED_FUNCTIONS='["_pikchr", "_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall"]' \
    -s MALLOC=emmalloc \
    -s MODULARIZE=1 \
    -s STRICT=1 \
    -o ./pikchr.js \
    pikchr.c

