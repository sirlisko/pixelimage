import { describe, expect, test } from "vitest";
import { plainPixels } from "../src/dither.ts";
import { prepare, quantize } from "../src/quantize.ts";
import { image } from "./image.ts";
import { GAMEBOY } from "./palettes.ts";

type Rgba = [number, number, number, number];
const grey = (v: number): Rgba => [v, v, v, 255];

/** A soft left-to-right gradient, `rows` tall: neither flat nor an edge anywhere. */
const gradient = (width: number, rows = 4) =>
	image(Array.from({ length: rows }, () => Array.from({ length: width }, (_, x) => grey(Math.round((x / (width - 1)) * 255)))));

const changes = (row: number[]) => row.slice(1).filter((v, i) => v !== row[i]).length;

describe("plainPixels", () => {
	test("leaves a soft gradient to be dithered", () => {
		expect([...plainPixels(prepare(gradient(16), { stretch: false }))].every((p) => p === 0)).toBe(true);
	});

	test("skips flat areas", () => {
		const flat = image([[grey(120), grey(121), grey(120)]]);
		expect([...plainPixels(prepare(flat, { stretch: false }))]).toEqual([1, 1, 1]);
	});

	test("skips edges, including ones where only the hue changes", () => {
		const hue = image([[[200, 60, 60, 255], [60, 100, 220, 255]]]);
		expect([...plainPixels(prepare(hue, { stretch: false }))]).toEqual([1, 1]);
	});
});

describe("dithering", () => {
	for (const dither of ["floyd", "bayer"] as const) {
		test(`${dither} breaks a gradient's bands into more transitions`, () => {
			const prepared = prepare(gradient(32), { stretch: false });
			const row = (d: typeof dither | "none") => [...quantize(prepared, GAMEBOY, { dither: d }).pixels.slice(32, 64)];
			expect(changes(row(dither))).toBeGreaterThan(changes(row("none")));
		});
	}

	test("leaves flat areas alone", () => {
		const flat = image([Array.from({ length: 8 }, () => grey(150))]);
		const pixels = [...quantize(prepare(flat, { stretch: false }), GAMEBOY, { dither: "floyd" }).pixels];
		expect(new Set(pixels).size).toBe(1);
	});
});
