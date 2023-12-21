#!/bin/sh
set -ex
rm -rf dist
scripts/build.sh
scripts/emit-package-json.js
cp LICENSE README.md dist
