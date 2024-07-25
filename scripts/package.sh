#!/bin/sh
set -ex
rm -rf dist
./rollup.config.js
scripts/emit-package-json.js
scripts/emit-declarations.sh
cp LICENSE README.md dist
