import { describe, expect, test } from "vitest";
import { extractPalette } from "../src/extract.ts";
import { image } from "./image.ts";

type Rgba = [number, number, number, number];
const R: Rgba = [228, 59, 68, 255];
const B: Rgba = [18, 78, 137, 255];
const Y: Rgba = [254, 231, 97, 255];
const CLEAR: Rgba = [0, 255, 0, 0];

describe("extractPalette", () => {
	test("finds the image's colours, dark to light", () => {
		const flag = image([[R, R, B, B, Y, Y]]);
		expect(extractPalette(flag, 3)).toEqual(["#124e89", "#e43b44", "#fee761"]);
	});

	test("never returns more colours than the image has", () => {
		expect(extractPalette(image([[R, R, B]]), 16)).toHaveLength(2);
	});

	test("keeps a small, distinct accent", () => {
		const bush = image([[...Array.from({ length: 30 }, (_, i) => [30, 120 + (i % 5) * 8, 40, 255] as Rgba), R]]);
		expect(extractPalette(bush, 3)).toContain("#e43b44");
	});

	test("ignores transparent pixels", () => {
		expect(extractPalette(image([[R, CLEAR]]), 4)).toEqual(["#e43b44"]);
	});

	test("snaps to the hardware's colour depth", () => {
		// With 3 bits per channel, every channel is a multiple of 255/7.
		for (const hex of extractPalette(image([[R, B, Y]]), 3, 3)) {
			for (const i of [1, 3, 5]) expect([0, 36, 73, 109, 146, 182, 219, 255]).toContain(Number.parseInt(hex.slice(i, i + 2), 16));
		}
	});

	test("is the same every time", () => {
		const photo = image([Array.from({ length: 64 }, (_, i) => [(i * 37) % 256, (i * 91) % 256, (i * 13) % 256, 255] as Rgba)]);
		expect(extractPalette(photo, 8)).toEqual(extractPalette(photo, 8));
	});
});
