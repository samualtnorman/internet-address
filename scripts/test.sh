#!/bin/sh
set -ex
tsc
tsc --project src --noEmit --emitDeclarationOnly false
vitest run
