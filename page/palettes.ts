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

export const paletteOf = (slug: string) => PALETTES[slug];
