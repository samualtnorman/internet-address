#!/bin/sh
set -ex
rm dist --recursive --force
mkdir dist --parents
(cd src; cp --parents *.ts **/*.ts ../dist)
cp LICENSE dist
scripts/emit-readme.js jsr | scripts/prepend-readme.js dist/default.ts
scripts/emit-jsr-json.js
