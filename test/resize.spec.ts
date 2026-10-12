import { describe, expect, test } from "vitest";
import { fullRect } from "../src/image.ts";
import { downscale } from "../src/resize.ts";
import { image, pixel } from "./image.ts";

const W = [255, 255, 255, 255] as [number, number, number, number];
const K = [0, 0, 0, 255] as [number, number, number, number];
const CLEAR = [255, 0, 0, 0] as [number, number, number, number];

describe("downscale", () => {
	test("averages in linear light", () => {
		const checker = image([
			[W, K],
			[K, W],
		]);
		// Half white in linear light is 188 in sRGB, not 128.
		expect(pixel(downscale(checker, fullRect(checker), 1, 1), 0, 0)).toEqual([188, 188, 188, 255]);
	});

	test("keeps the colour of opaque pixels next to transparent ones", () => {
		const edge = image([[W, CLEAR]]);
		expect(pixel(downscale(edge, fullRect(edge), 1, 1), 0, 0)).toEqual([255, 255, 255, 128]);
	});

	test("weighs pixels split between two outputs", () => {
		const strip = image([[W, W, K]]);
		const out = downscale(strip, fullRect(strip), 2, 1);
		expect(pixel(out, 0, 0)).toEqual(W);
		// Half of the second white pixel and all of the black one: a third white.
		expect(pixel(out, 1, 0)).toEqual([156, 156, 156, 255]);
	});

	test("reads only the cropped area", () => {
		const strip = image([[K, W, W, K]]);
		expect(pixel(downscale(strip, { x: 1, y: 0, width: 2, height: 1 }, 1, 1), 0, 0)).toEqual(W);
	});

	test("scales up by repeating pixels", () => {
		const dot = image([[W, K]]);
		const out = downscale(dot, fullRect(dot), 4, 1);
		expect([0, 1, 2, 3].map((x) => pixel(out, x, 0)[0])).toEqual([255, 255, 0, 0]);
	});
});
