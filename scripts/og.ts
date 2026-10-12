import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import type { Dither } from "../src/dither.ts";
import { CLEAR, type Img } from "../src/image.ts";
import { centredSquare, renderer } from "../src/render.ts";

const W = 1200;
const H = 630;
const PAD = 80;
const BG = "#f6f5f0";
const FG = "#1b1b19";
const MUTED = "#6f6c64";
const ACCENT = "#d9480f";

const TILE = 300;
const TILE_Y = 250;
const GAP = (W - 2 * PAD - 3 * TILE) / 2;

const ENDESGA_32 =
	"be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761 63c74d 3e8948 265c42 193c3e 124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466 262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569";
const GAMEBOY = "0f380f 306230 8bac0f 9bbc0f";
const hexes = (list: string) => list.split(" ").map((c) => `#${c}`);

// 5×9 lowercase glyphs: two ascender rows, five x-height rows, two descender rows.
const GLYPHS: Record<string, string[]> = {
	p: ["", "", "####", "#   #", "#   #", "#   #", "####", "#", "#"],
	i: ["  #", "", " ##", "  #", "  #", "  #", " ###"],
	x: ["", "", "#   #", " # #", "  #", " # #", "#   #"],
	e: ["", "", " ###", "#   #", "#####", "#", " ####"],
	l: [" ##", "  #", "  #", "  #", "  #", "  #", " ###"],
	m: ["", "", "## #", "# # #", "# # #", "# # #", "#   #"],
	a: ["", "", " ###", "    #", " ####", "#   #", " ####"],
	g: ["", "", " ####", "#   #", "#   #", "#   #", " ####", "    #", " ###"],
};

const pixelText = (text: string) => {
	let d = "";
	[...text].forEach((ch, i) => {
		GLYPHS[ch]?.forEach((row, y) => {
			for (let x = 0; x < row.length; x++) if (row[x] === "#") d += `M${i * 6 + x} ${y}h1v1h-1z`;
		});
	});
	return d;
};

const photo = `data:image/jpeg;base64,${readFileSync("scripts/og-photo.jpg").toString("base64")}`;
const photoTile = (x: number) =>
	`<image x="${x}" y="${TILE_Y}" width="${TILE}" height="${TILE}" href="${photo}" preserveAspectRatio="xMidYMid slice"/>`;

/** The photo as pixels, so it goes through the same pipeline as on the page. */
const source = (): Img => {
	const size = 600;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><image width="${size}" height="${size}" href="${photo}" preserveAspectRatio="xMidYMid slice"/></svg>`;
	const { width, height, pixels } = new Resvg(svg).render();
	return { width, height, data: new Uint8ClampedArray(pixels) };
};

const img = source();
const render = renderer();

const spriteTile = (x: number, colors: string[], size: number, dither: Dither) => {
	const { width, pixels } = render(img, {
		crop: centredSquare(img),
		size,
		palette: { colors },
		stretch: true,
		dither,
		cap: 0,
		background: { seeds: [], tolerance: 0.1 },
	}).sprite;
	const paths = new Map<number, string>();
	pixels.forEach((p, i) => {
		if (p !== CLEAR) paths.set(p, `${paths.get(p) ?? ""}M${i % width} ${Math.floor(i / width)}h1v1h-1z`);
	});
	const body = [...paths].map(([p, d]) => `<path fill="${colors[p]}" d="${d}"/>`).join("");
	return `<g transform="translate(${x} ${TILE_Y}) scale(${TILE / width})">${body}</g>`;
};

const TITLE_SCALE = 10;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<rect width="${W}" height="${H}" fill="${BG}"/>
<g transform="translate(${PAD} ${PAD - 20}) scale(${TITLE_SCALE})" fill="${ACCENT}"><path d="${pixelText("pixelimage")}"/></g>
<g font-family="Menlo, monospace" fill="${FG}">
<text x="${PAD}" y="200" font-size="30">Any image, turned into pixel art in your palette.</text>
</g>
${photoTile(PAD)}
${spriteTile(PAD + TILE + GAP, hexes(ENDESGA_32), 32, "none")}
${spriteTile(PAD + 2 * (TILE + GAP), hexes(GAMEBOY), 64, "floyd")}
<g font-family="Menlo, monospace" font-size="20" fill="${MUTED}">
<text x="${PAD}" y="${TILE_Y + TILE + 32}">Original</text>
<text x="${PAD + TILE + GAP}" y="${TILE_Y + TILE + 32}">Endesga 32 · 32px</text>
<text x="${PAD + 2 * (TILE + GAP)}" y="${TILE_Y + TILE + 32}">Game Boy · 64px, dithered</text>
<text x="${W - PAD}" y="${PAD + 30}" text-anchor="end">pixelimage.sirlisko.com</text>
</g>
</svg>`;

const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: "Menlo" } }).render().asPng();
writeFileSync("page/public/og.png", png);
