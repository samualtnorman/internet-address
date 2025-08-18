import { findFiles } from "@samual/lib/findFiles"

export const getExports = async (
	/** @type {string} */ queryFileExtension,
	/** @type {string} */ outputFileExtension = queryFileExtension
) => /** @type {Record<string, string>} */ ({
	".": `./default${outputFileExtension}`,
	...Object.fromEntries(
		(await findFiles(`dist`))
			.filter(path => path != `dist/default${queryFileExtension}` && path != `dist/internal${queryFileExtension}` && path.endsWith(queryFileExtension))
			.map(path => {
				const sliced = `.${path.slice(4, -queryFileExtension.length)}`

				return [ sliced, sliced + outputFileExtension ]
			})
	)
})
