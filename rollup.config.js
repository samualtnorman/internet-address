#!node_modules/.bin/rollup --config
import { rollupConfig } from "@samual/rollup-config"
import Path from "path"

export default rollupConfig(
	process.env.JSR
		? {
			rollupOptions: { output: { preserveModules: true, banner: chunk => `// @ts-self-types="./${Path.basename(chunk.name)}.d.ts"` } },
			terserOptions: { format: { comments: /@ts-self-types/ } }
		}
		: { rollupOptions: { output: { preserveModules: true } } }
)
