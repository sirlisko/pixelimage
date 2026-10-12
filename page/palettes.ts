export interface Palette {
	name: string;
	colors: string[];
}

const hexes = (list: string) => list.split(" ").map((c) => `#${c.toLowerCase()}`);

// The Master System can show every colour with 2 bits per channel; Lospec doesn't list it.
const twoBitRgb = () => {
	const levels = ["00", "55", "aa", "ff"];
	return levels.flatMap((r) => levels.flatMap((g) => levels.map((b) => `#${r}${g}${b}`)));
};

/** Keyed by Lospec slug, so a link keeps working if these are ever loaded from Lospec instead. */
export const PALETTES: Record<string, Palette> = {
	"original-gameboy": { name: "Game Boy", colors: hexes("0f380f 306230 8bac0f 9bbc0f") },
	"virtual-boy": { name: "Virtual Boy", colors: hexes("ef0000 a40000 550000 000000") },
	"nintendo-entertainment-system": {
		name: "NES",
		colors: hexes(
			"000000 fcfcfc f8f8f8 bcbcbc 7c7c7c a4e4fc 3cbcfc 0078f8 0000fc b8b8f8 6888fc 0058f8 0000bc d8b8f8 9878f8 6844fc 4428bc f8b8f8 f878f8 d800cc 940084 f8a4c0 f85898 e40058 a80020 f0d0b0 f87858 f83800 a81000 fce0a8 fca044 e45c10 881400 f8d878 f8b800 ac7c00 503000 d8f878 b8f818 00b800 007800 b8f8b8 58d854 00a800 006800 b8f8d8 58f898 00a844 005800 00fcfc 00e8d8 008888 004058 f8d8f8 787878",
		),
	},
	"master-system": { name: "Master System", colors: twoBitRgb() },
	"pico-8": {
		name: "PICO-8",
		colors: hexes(
			"000000 1d2b53 7e2553 008751 ab5236 5f574f c2c3c7 fff1e8 ff004d ffa300 ffec27 00e436 29adff 83769c ff77a8 ffccaa",
		),
	},
	"commodore64": {
		name: "Commodore 64",
		colors: hexes(
			"000000 626262 898989 adadad ffffff 9f4e44 cb7e75 6d5412 a1683c c9d487 9ae29b 5cab5e 6abfc6 887ecb 50459b a057a3",
		),
	},
	"zx-spectrum": {
		name: "ZX Spectrum",
		colors: hexes(
			"000000 0000d8 0000ff d80000 ff0000 d800d8 ff00ff 00d800 00ff00 00d8d8 00ffff d8d800 ffff00 d8d8d8 ffffff",
		),
	},
	"amstrad-cpc": {
		name: "Amstrad CPC",
		colors: hexes(
			"040404 808080 ffffff 800000 ff0000 ff8080 ff7f00 ffff80 ffff00 808000 008000 01ff00 80ff00 80ff80 01ff80 008080 01ffff 80ffff 0080ff 0000ff 00007f 7f00ff 8080ff ff80ff ff00ff ff0080 800080",
		),
	},
	"msx": {
		name: "MSX",
		colors: hexes(
			"000000 cacaca ffffff b75e51 d96459 fe877c cac15e ddce85 3ca042 40b64a 73ce7c 5955df 7e75f0 64daee b565b3",
		),
	},
	"apple-ii": {
		name: "Apple II",
		colors: hexes(
			"000000 515c16 843d52 ea7d27 514888 e85def f5b7c9 006752 00c82c 919191 c9d199 00a6f0 98dbc9 c8c1f7 ffffff",
		),
	},
	"cga-palette-1-high": { name: "CGA (palette 1, high)", colors: hexes("000000 ff55ff 55ffff ffffff") },
	"macintosh-ii": {
		name: "Macintosh II",
		colors: hexes(
			"ffffff ffff00 ff6500 dc0000 ff0097 360097 0000ca 0097ff 00a800 006500 653600 976536 b9b9b9 868686 454545 000000",
		),
	},
	"endesga-32": {
		name: "Endesga 32",
		colors: hexes(
			"be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761 63c74d 3e8948 265c42 193c3e 124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466 262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569",
		),
	},
	"endesga-64": {
		name: "Endesga 64",
		colors: hexes(
			"ff0040 131313 1b1b1b 272727 3d3d3d 5d5d5d 858585 b4b4b4 ffffff c7cfdd 92a1b9 657392 424c6e 2a2f4e 1a1932 0e071b 1c121c 391f21 5d2c28 8a4836 bf6f4a e69c69 f6ca9f f9e6cf edab50 e07438 c64524 8e251d ff5000 ed7614 ffa214 ffc825 ffeb57 d3fc7e 99e65f 5ac54f 33984b 1e6f50 134c4c 0c2e44 00396d 0069aa 0098dc 00cdf9 0cf1ff 94fdff fdd2ed f389f5 db3ffd 7a09fa 3003d9 0c0293 03193f 3b1443 622461 93388f ca52c9 c85086 f68187 f5555d ea323c c42430 891e2b 571c27",
		),
	},
	"dawnbringer-16": {
		name: "DawnBringer 16",
		colors: hexes(
			"140c1c 442434 30346d 4e4a4e 854c30 346524 d04648 757161 597dce d27d2c 8595a1 6daa2c d2aa99 6dc2ca dad45e deeed6",
		),
	},
	"dawnbringer-32": {
		name: "DawnBringer 32",
		colors: hexes(
			"000000 222034 45283c 663931 8f563b df7126 d9a066 eec39a fbf236 99e550 6abe30 37946e 4b692f 524b24 323c39 3f3f74 306082 5b6ee1 639bff 5fcde4 cbdbfc ffffff 9badb7 847e87 696a6a 595652 76428a ac3232 d95763 d77bba 8f974a 8a6f30",
		),
	},
	"sweetie-16": {
		name: "Sweetie 16",
		colors: hexes(
			"1a1c2c 5d275d b13e53 ef7d57 ffcd75 a7f070 38b764 257179 29366f 3b5dc9 41a6f6 73eff7 f4f4f4 94b0c2 566c86 333c57",
		),
	},
	"aap-64": {
		name: "AAP-64",
		colors: hexes(
			"060608 141013 3b1725 73172d b4202a df3e23 fa6a0a f9a31b ffd541 fffc40 d6f264 9cdb43 59c135 14a02e 1a7a3e 24523b 122020 143464 285cc4 249fde 20d6c7 a6fcdb ffffff fef3c0 fad6b8 f5a097 e86a73 bc4a9b 793a80 403353 242234 221c1a 322b28 71413b bb7547 dba463 f4d29c dae0ea b3b9d1 8b93af 6d758d 4a5462 333941 422433 5b3138 8e5252 ba756a e9b5a3 e3e6ff b9bffb 849be4 588dbe 477d85 23674e 328464 5daf8d 92dcba cdf7e2 e4d2aa c7b08b a08662 796755 5a4e44 423934",
		),
	},
	"resurrect-64": {
		name: "Resurrect 64",
		colors: hexes(
			"2e222f 3e3546 625565 966c6c ab947a 694f62 7f708a 9babb2 c7dcd0 ffffff 6e2727 b33831 ea4f36 f57d4a ae2334 e83b3b fb6b1d f79617 f9c22b 7a3045 9e4539 cd683d e6904e fbb954 4c3e24 676633 a2a947 d5e04b fbff86 165a4c 239063 1ebc73 91db69 cddf6c 313638 374e4a 547e64 92a984 b2ba90 0b5e65 0b8a8f 0eaf9b 30e1b9 8ff8e2 323353 484a77 4d65b4 4d9be6 8fd3ff 45293f 6b3e75 905ea9 a884f3 eaaded 753c54 a24b6f cf657f ed8099 831c5d c32454 f04f78 f68181 fca790 fdcbb0",
		),
	},
};

/** How the picker groups the built-in palettes. */
export const GROUPS: [string, string[]][] = [
	[
		"Consoles and computers",
		[
			"original-gameboy",
			"virtual-boy",
			"nintendo-entertainment-system",
			"master-system",
			"pico-8",
			"commodore64",
			"zx-spectrum",
			"amstrad-cpc",
			"msx",
			"apple-ii",
			"cga-palette-1-high",
			"macintosh-ii",
		],
	],
	[
		"Artist palettes",
		[
			"endesga-32",
			"endesga-64",
			"dawnbringer-16",
			"dawnbringer-32",
			"sweetie-16",
			"aap-64",
			"resurrect-64",
		],
	],
];

// Lospec's largest palettes. The editor shows every colour as a swatch, so it can't grow without bound.
export const MAX_PALETTE = 256;

const loaded = new Map<string, Palette>();

export const paletteOf = (slug: string) => PALETTES[slug] ?? loaded.get(slug);
/** Palettes loaded from Lospec this session, for the picker. */
export const loadedPalettes = () => [...loaded];
/** Brings back a Lospec palette saved with a project, without fetching it. */
export const rememberPalette = (slug: string, palette: Palette) => {
	if (!paletteOf(slug)) loaded.set(slug, palette);
};

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
