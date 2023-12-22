#!node_modules/.bin/rollup --config
import { babel } from "@rollup/plugin-babel"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import { dts } from "rollup-plugin-dts"
import { findFiles } from "./node_modules/@samual/lib/findFiles.js"

const SourceFolder = "src"
const Minify = false

export default findFiles(SourceFolder).then(foundFiles => /** @type {import("rollup").RollupOptions} */ ([
	{
		input: Object.fromEntries(
			foundFiles
				.filter(path => path.endsWith(".ts") && !path.endsWith(".d.ts"))
				.map(path => [ path.slice(SourceFolder.length + 1, -3), path ])
		),
		output: { dir: "dist", generatedCode: "es2015", interop: "auto", compact: Minify },
		plugins: [
			nodeResolve({ extensions: [ ".ts" ] }),
			babel({
				babelHelpers: "bundled",
				extensions: [ ".ts" ],
				presets: [
					[ "@babel/preset-env", { targets: { node: "20" } } ],
					[ "@babel/preset-typescript", { allowDeclareFields: true } ]
				]
			})
		],
		strictDeprecations: true
	},
	{
		input: { index: "src/index.ts", IPv4: "src/IPv4/index.ts", IPv6: "src/IPv6.ts" },
		output: { dir: "dist", generatedCode: "es2015", interop: "auto", compact: Minify },
		plugins: [ dts() ],
		preserveEntrySignatures: "allow-extension",
		strictDeprecations: true
	}
]))
