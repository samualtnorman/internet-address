#!/bin/sh
set -ex
rm dist --recursive --force
JSR=1 ./rollup.config.js
scripts/emit-dts.sh
cp LICENSE dist
scripts/emit-readme.js jsr | scripts/prepend-readme.js dist/default.d.ts
scripts/emit-jsr-json.js
