#!node_modules/.bin/rollup --config
import { babel } from "@rollup/plugin-babel"

/** @type {import("rollup").RollupOptions} */
export default {
	input: "src/index.ts",
	output: { file: "dist/index.js" },
	plugins: [
		babel({
			babelHelpers: "bundled",
			extensions: [ ".ts" ],
			presets: [
				[ "@babel/preset-env", { targets: { node: "20" } } ],
				[ "@babel/preset-typescript", { allowDeclareFields: true } ]
			]
		})
	]
}
