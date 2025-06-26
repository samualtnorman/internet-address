#!/usr/bin/env node
import { readFileSync } from "fs"

/** @type {<TSource extends { indexOf(search: TSearch, fromIndex?: number): number }, TSearch>(
	source: TSource,
	searches: TSearch[],
	fromIndex?: number
) => number} */
const firstIndexOf = (source, searches, fromIndex) => searches
	.map(search => source.indexOf(search, fromIndex))
	.reduce((accumulator, index) =>
		accumulator == -1 ?
			index
		: index == -1 ?
			accumulator
		: Math.min(accumulator, index)
	)

const source = readFileSync(`src/readme.md`, { encoding: `utf8` })
let index = firstIndexOf(source, [ `\\(`, `\\{` ])
let closeIndex = 0
let output = `let o = "";\n`

while (index != -1) {
	if (closeIndex != index)
		output += `\n;o += ${JSON.stringify(source.slice(closeIndex, index))};\n`

	if ((index + 2) >= source.length)
		throw Error(`unexpected end`)

	index++

	if (source[index] == `(`) {
		index++
		closeIndex = source.indexOf(`\\)`, index)

		if (closeIndex == -1)
			throw Error(`couldn't find close`)

		output += source.slice(index, closeIndex)
		closeIndex += 2

		if (closeIndex >= source.length)
			break
	} else {
		index++
		closeIndex = source.indexOf(`\\}`, index)

		if (closeIndex == -1)
			throw Error(`couldn't find close`)

		output += `\n;o += (${source.slice(index, closeIndex)});\n`
		closeIndex += 2

		if (closeIndex >= source.length)
			break
	}

	index = firstIndexOf(source, [ `\\(`, `\\{` ], closeIndex + 1)
}

if (closeIndex + 1 < source.length)
	output += `\n;o += ${JSON.stringify(source.slice(closeIndex))};\n`

output += `\n;return o;\n`
process.stdout.write(new Function(output)())
