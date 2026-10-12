import { describe, expect, test } from "vitest";
import { CLEAR } from "../src/image.ts";
import { centredSquare, outputSize, renderer } from "../src/render.ts";
import { image } from "./image.ts";
import { GAMEBOY } from "./palettes.ts";

const K = [0, 0, 0, 255] as [number, number, number, number];
const W = [255, 255, 255, 255] as [number, number, number, number];
const R = [200, 30, 40, 255] as [number, number, number, number];
const NONE = { seeds: [], tolerance: 0.1 };

describe("render", () => {
	test("crops a wide image to its middle square", () => {
		expect(centredSquare(image([[K, W, W, K]]))).toEqual({ x: 1.5, y: 0, width: 1, height: 1 });
	});

	test("keeps the crop's aspect ratio", () => {
		expect(outputSize({ crop: { x: 0, y: 0, width: 200, height: 100 }, size: 32 })).toEqual({ width: 32, height: 16 });
	});

	test("turns an image into palette indexes", () => {
		const source = image([
			[K, W],
			[W, K],
		]);
		const { sprite } = renderer()(source, { crop: centredSquare(source), size: 2, palette: { colors: GAMEBOY }, stretch: true, dither: "none", cap: 0, background: NONE });
		expect([...sprite.pixels]).toEqual([0, 3, 3, 0]);
	});

	test("clears the background where it was clicked", () => {
		const source = image([
			[W, W, W],
			[W, R, W],
			[W, W, W],
		]);
		const background = { seeds: [{ x: 0, y: 0 }], tolerance: 0.1 };
		const { sprite } = renderer()(source, { crop: centredSquare(source), size: 3, palette: { colors: GAMEBOY }, stretch: true, dither: "none", cap: 0, background });
		expect([...sprite.pixels].map((p) => p !== CLEAR)).toEqual([false, false, false, false, true, false, false, false, false]);
	});

	test("takes the palette from the image when asked", () => {
		const source = image([[K, W, R]]);
		const { sprite, colors } = renderer()(source, {
			crop: { x: 0, y: 0, width: 3, height: 1 },
			size: 3,
			palette: { fromImage: { count: 8 } },
			stretch: true,
			dither: "none",
			cap: 0,
			background: NONE,
		});
		expect(colors).toHaveLength(3);
		expect([...sprite.pixels].map((p) => colors[p])).toEqual(["#000000", "#ffffff", "#c81e28"]);
	});

	test("matches a palette from the image by colour, even when it's all one hue", () => {
		const blues = [[10, 20, 60, 255], [60, 90, 160, 255], [180, 200, 240, 255]] as [number, number, number, number][];
		const source = image([blues]);
		const { sprite, colors } = renderer()(source, {
			crop: { x: 0, y: 0, width: 3, height: 1 },
			size: 3,
			palette: { fromImage: { count: 3 } },
			stretch: true,
			dither: "none",
			cap: 0,
			background: NONE,
		});
		expect([...sprite.pixels].map((p) => colors[p])).toEqual(["#0a143c", "#3c5aa0", "#b4c8f0"]);
	});
});
