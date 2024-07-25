#!/usr/bin/env node
import { spawnSync } from "child_process"
import * as semver from "semver"
import packageConfig from "../package.json" with { type: "json" }

const hash = spawnSync("git", [ "rev-parse", "--short", "HEAD" ], { encoding: "utf8" }).stdout.trim()

spawnSync("pnpm", [ "version", `${semver.inc(packageConfig.version, "patch")}-${hash}` ], { stdio: "inherit" })
process.exit()
