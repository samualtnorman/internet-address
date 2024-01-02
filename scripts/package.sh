#!/bin/sh
set -ex
rm -rf dist
scripts/build.sh
scripts/emit-package-json.js
scripts/emit-declarations.sh
cp LICENSE README.md dist
