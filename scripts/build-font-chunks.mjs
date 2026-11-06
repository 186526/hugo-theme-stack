import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(process.env.FONT_CHUNK_PUBLIC_DIR ?? "public");
const FONT_DIR = join(PUBLIC_DIR, "fonts");
const CACHE_DIR = resolve(process.env.FONT_CHUNK_CACHE_DIR ?? ".cache");
const MANIFEST_PATH = join(SCRIPT_DIR, "font-chunks.json");
const PLACEHOLDER_PATH = join(SCRIPT_DIR, "..", "static", "fonts", "noto-sans-sc.css");

const CHUNK_SIZE = 200;
const RANGE_MERGE_GAP = 1;
const LATIN_CHARACTERS = Array.from({ length: 0x7f - 0x20 }, (_, index) => String.fromCodePoint(index + 0x20));

const FAMILIES = [
	{
		cssFamily: "Noto Sans SC",
		slug: "noto-sans-sc",
		weights: [400, 700],
		sourceUrl:
			"https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/Variable/TTF/Subset/NotoSansSC-VF.ttf",
	},
	{
		cssFamily: "Noto Serif SC",
		slug: "noto-serif-sc",
		weights: [400, 700],
		sourceUrl:
			"https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Serif/Variable/TTF/Subset/NotoSerifSC-VF.ttf",
	},
	{
		cssFamily: "Inter",
		slug: "inter",
		weights: [400, 700],
		characters: LATIN_CHARACTERS,
		sourcePath: join(SCRIPT_DIR, "..", "assets", "fonts", "inter.ttf"),
	},
	{
		cssFamily: "Fira Code",
		slug: "fira-code",
		weights: [400, 700],
		characters: LATIN_CHARACTERS,
		sourcePath: join(SCRIPT_DIR, "..", "assets", "fonts", "firacode.ttf"),
	},
];

const CJK_START = 0x4e00;
const CJK_END = 0x9fff;

function sourceFontPath(family) {
	return join(CACHE_DIR, `${family.slug}-source.ttf`);
}

async function loadSourceFont(family) {
	if (family.sourcePath) {
		return readFileSync(family.sourcePath);
	}

	const path = sourceFontPath(family);

	if (existsSync(path)) {
		return readFileSync(path);
	}

	mkdirSync(CACHE_DIR, { recursive: true });

	const response = await fetch(family.sourceUrl);
	if (!response.ok) {
		throw new Error(`Failed to download ${family.sourceUrl}: ${response.status}`);
	}

	const font = Buffer.from(await response.arrayBuffer());
	writeFileSync(path, font);
	return font;
}

function collectCharacterFrequency(directory) {
	const frequency = new Map();

	function walk(current) {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const path = join(current, entry.name);

			if (entry.isDirectory()) {
				walk(path);
				continue;
			}

			if (!entry.name.endsWith(".html")) {
				continue;
			}

			const text = readFileSync(path, "utf8")
				.replace(/<script[\s\S]*?<\/script>/g, "")
				.replace(/<style[\s\S]*?<\/style>/g, "")
				.replace(/<[^>]+>/g, "");

			for (const character of text) {
				const code = character.codePointAt(0);
				if (code >= CJK_START && code <= CJK_END) {
					frequency.set(character, (frequency.get(character) ?? 0) + 1);
				}
			}
		}
	}

	walk(directory);
	return frequency;
}

function loadManifest() {
	if (!existsSync(MANIFEST_PATH)) {
		return {};
	}

	const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
	return manifest.chunks ? { "noto-sans-sc": manifest } : manifest;
}

function assignCharactersToChunks(characters, publishedChunks) {
	const chunks = publishedChunks.map((chunk) => [...chunk]);
	const assigned = new Set(chunks.flat());
	const pending = characters.filter((character) => !assigned.has(character));

	for (const character of pending) {
		const openChunk = chunks.find((chunk) => chunk.length < CHUNK_SIZE);

		if (openChunk) {
			openChunk.push(character);
		} else {
			chunks.push([character]);
		}
	}

	return chunks;
}

function buildUnicodeRange(characters) {
	const codes = characters
		.map((character) => character.codePointAt(0))
		.sort((a, b) => a - b);

	const ranges = [];
	let start = codes[0];
	let end = codes[0];

	for (const code of codes.slice(1)) {
		if (code - end <= RANGE_MERGE_GAP) {
			end = code;
			continue;
		}

		ranges.push([start, end]);
		start = code;
		end = code;
	}

	ranges.push([start, end]);

	return ranges
		.map(([from, to]) => (from === to ? `U+${from.toString(16).toUpperCase()}` : `U+${from.toString(16).toUpperCase()}-${to.toString(16).toUpperCase()}`))
		.join(", ");
}

function fingerprint(characters) {
	return createHash("sha256").update(characters.join("")).digest("hex").slice(0, 12);
}

async function buildFamily(family, chunks, sourceFont) {
	const faces = [];
	let totalBytes = 0;

	for (const [index, characters] of chunks.entries()) {
		if (characters.length === 0) {
			continue;
		}

		const hash = fingerprint(characters);
		const unicodeRange = buildUnicodeRange(characters);

		for (const weight of family.weights) {
			const fileName = `${family.slug}-${index}-${weight}-${hash}.woff2`;
			const subset = await subsetFont(sourceFont, characters.join(""), {
				targetFormat: "woff2",
				variationAxes: { wght: weight },
			});

			writeFileSync(join(FONT_DIR, fileName), subset);
			totalBytes += subset.length;

			faces.push(
				`@font-face{font-family:"${family.cssFamily}";font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/${fileName}) format("woff2");unicode-range:${unicodeRange}}`,
			);
		}
	}

	return { faces, totalBytes };
}

function writeStylesheet(family, faces) {
	const stylesheet = `${faces.join("\n")}\n`;
	const hash = createHash("sha256").update(stylesheet).digest("hex").slice(0, 12);
	const fingerprinted = `${family.slug}.${hash}.css`;

	for (const entry of readdirSync(FONT_DIR)) {
		if (new RegExp(`^${family.slug}(\\.[0-9a-f]+)?\\.css$`).test(entry)) {
			rmSync(join(FONT_DIR, entry));
		}
	}

	writeFileSync(join(FONT_DIR, fingerprinted), stylesheet);
	writeFileSync(join(FONT_DIR, `${family.slug}.css`), stylesheet);

	return fingerprinted;
}

function rewriteStylesheetReferences(directory, fingerprintedNames) {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);

		if (entry.isDirectory()) {
			rewriteStylesheetReferences(path, fingerprintedNames);
			continue;
		}

		if (!entry.name.endsWith(".html")) {
			continue;
		}

		let html = readFileSync(path, "utf8");
		const original = html;

		for (const [slug, name] of Object.entries(fingerprintedNames)) {
			html = html.replace(new RegExp(`/fonts/${slug}(\\.[0-9a-f]+)?\\.css`, "g"), `/fonts/${name}`);
		}

		if (html !== original) {
			writeFileSync(path, html);
		}
	}
}

function writePlaceholder() {
	writeFileSync(
		PLACEHOLDER_PATH,
		"/* 占位文件：由 scripts/build-font-chunks.mjs 在构建时改写为带指纹的版本，未运行脚本时页面回退到系统字体 */\n",
	);
}

async function main() {
	const frequency = collectCharacterFrequency(PUBLIC_DIR);
	const ranked = [...frequency.entries()].sort((a, b) => b[1] - a[1]).map(([character]) => character);
	const manifest = loadManifest();

	mkdirSync(FONT_DIR, { recursive: true });

	const stylesheets = {};

	for (const family of FAMILIES) {
		const sourceFont = await loadSourceFont(family);
		const chunks = family.characters
			? [family.characters]
			: assignCharactersToChunks(ranked, manifest[family.slug]?.chunks ?? []);
		const { faces, totalBytes } = await buildFamily(family, chunks, sourceFont);

		if (!family.characters) {
			manifest[family.slug] = { chunks };
		}

		stylesheets[family.slug] = {
			slug: family.slug,
			name: writeStylesheet(family, faces),
			chunks: chunks.length,
			weights: family.weights.length,
			totalBytes,
		};
	}

	writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, "\t")}\n`);

	rewriteStylesheetReferences(
		PUBLIC_DIR,
		Object.fromEntries(Object.values(stylesheets).map((stylesheet) => [stylesheet.slug, stylesheet.name])),
	);
	writePlaceholder();

	for (const stylesheet of Object.values(stylesheets)) {
		console.log(
			`[font-chunks] ${stylesheet.slug}: ${stylesheet.chunks} chunks x ${stylesheet.weights} weights, ${Math.round(stylesheet.totalBytes / 1024)} KB, stylesheet ${stylesheet.name}`,
		);
	}
}

await main();
