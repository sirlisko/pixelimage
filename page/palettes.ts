export interface Palette {
	name: string;
	colors: string[];
}

const hexes = (list: string) => list.split(" ").map((c) => `#${c.toLowerCase()}`);

/** Keyed by Lospec slug, so a link keeps working if these are ever loaded from Lospec instead. */
export const PALETTES: Record<string, Palette> = {
	"original-gameboy": { name: "Game Boy", colors: hexes("0f380f 306230 8bac0f 9bbc0f") },
	"pico-8": {
		name: "PICO-8",
		colors: hexes("000000 1d2b53 7e2553 008751 ab5236 5f574f c2c3c7 fff1e8 ff004d ffa300 ffec27 00e436 29adff 83769c ff77a8 ffccaa"),
	},
	"endesga-32": {
		name: "Endesga 32",
		colors: hexes(
			"be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761 63c74d 3e8948 265c42 193c3e 124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466 262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569",
		),
	},
};

// Lospec's largest palettes. The editor shows every colour as a swatch, so it can't grow without bound.
export const MAX_PALETTE = 256;

const loaded = new Map<string, Palette>();

export const paletteOf = (slug: string) => PALETTES[slug] ?? loaded.get(slug);
/** Palettes loaded from Lospec this session, for the picker. */
export const loadedPalettes = () => [...loaded];

/** Accepts a Lospec slug or a link to the palette's Lospec page. */
export const slugOf = (input: string) =>
	input.trim().toLowerCase().replace(/\/+$/, "").split("/").pop()?.replace(/\.json$/, "") ?? "";

export const loadPalette = async (slug: string): Promise<Palette> => {
	const known = paletteOf(slug);
	if (known) return known;
	// Slugs end up in saved projects, so anything else is refused before it gets there.
	if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("That isn't a Lospec palette name.");
	const missing = new Error(`Lospec has no palette called “${slug}”, or couldn't be reached.`);
	// Lospec's 404s carry no CORS header, so a missing palette fails like a network error and the two can't be told apart.
	const res = await fetch(`https://lospec.com/palette-list/${slug}.json`).catch(() => {
		throw missing;
	});
	if (!res.ok) throw missing;
	const { name, colors } = await res.json();
	if (!Array.isArray(colors) || !colors.length || !colors.every((c) => /^[0-9a-f]{6}$/i.test(c))) {
		throw new Error(`Couldn't read the colours of “${slug}”.`);
	}
	if (colors.length > MAX_PALETTE) {
		throw new Error(`${name || slug} has ${colors.length} colours. Up to ${MAX_PALETTE} fit.`);
	}
	const palette = { name: String(name || slug), colors: hexes(colors.join(" ")) };
	loaded.set(slug, palette);
	return palette;
};
