#!node_modules/.bin/rollup --config
import babelPresetEnv from "@babel/preset-env"
import babelPresetTypescript from "@babel/preset-typescript"
import * as t from "@babel/types"
import { babel } from "@rollup/plugin-babel"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import { findFiles } from "./node_modules/@samual/lib/findFiles.js"

const SourceFolder = "src"
const Minify = false

export default findFiles(SourceFolder).then(foundFiles => /** @type {import("rollup").RollupOptions} */ ({
	input: Object.fromEntries(
		foundFiles.filter(path => path.endsWith(".ts") && !path.endsWith(".d.ts"))
			.map(path => [ path.slice(SourceFolder.length + 1, -3), path ])
	),
	output: { dir: "dist", generatedCode: "es2015", interop: "auto", compact: Minify },
	plugins: [
		nodeResolve({ extensions: [ ".ts" ] }),
		babel({
			babelHelpers: "bundled",
			extensions: [ ".ts" ],
			presets: [
				[ babelPresetEnv, { targets: { node: "20" } } ],
				[ babelPresetTypescript, { allowDeclareFields: true } ]
			],
			plugins: [
				/** @type {import("@babel/core").PluginObj} */ ({
					name: "import.meta.vitest -> undefined",
					visitor: {
						MemberExpression(path) {
							if (path.node.object.type == "MetaProperty" && path.node.property.type == "Identifier" &&
								path.node.property.name == "vitest"
							)
								path.replaceWith(t.identifier("undefined"))
						}
					}
				})
			]
		})
	],
	strictDeprecations: true
}))
