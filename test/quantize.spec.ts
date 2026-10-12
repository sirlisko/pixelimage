import { describe, expect, test } from "vitest";
import { CLEAR } from "../src/image.ts";
import { prepare, quantize } from "../src/quantize.ts";
import { image } from "./image.ts";
import { GAMEBOY, PICO8 } from "./palettes.ts";

const grey = (v: number) => [v, v, v, 255] as [number, number, number, number];

describe("quantize", () => {
	test("spreads black to white across a ramp", () => {
		const ramp = image([[grey(0), grey(90), grey(170), grey(255)]]);
		expect([...quantize(prepare(ramp, { stretch: false }), GAMEBOY).pixels]).toEqual([0, 1, 2, 3]);
	});

	test("picks the nearest colour in a full-colour palette", () => {
		const reds = image([[[250, 0, 70, 255], [0, 0, 0, 255], [255, 240, 230, 255]]]);
		expect([...quantize(prepare(reds, { stretch: false }), PICO8).pixels].map((i) => PICO8[i])).toEqual([
			"#ff004d",
			"#000000",
			"#fff1e8",
		]);
	});

	test("leaves transparent pixels empty", () => {
		const half = image([[grey(0), [0, 0, 0, 100]]]);
		expect([...quantize(prepare(half, { stretch: false }), GAMEBOY).pixels]).toEqual([0, CLEAR]);
	});

	test("stretches a dark image across the whole ramp", () => {
		const dark = image([[grey(10), grey(25), grey(40), grey(55)]]);
		expect(Math.max(...quantize(prepare(dark, { stretch: false }), GAMEBOY).pixels)).toBeLessThan(3);
		expect([...quantize(prepare(dark, { stretch: true }), GAMEBOY).pixels]).toEqual([0, 1, 2, 3]);
	});

	test("stretches by the opaque pixels only", () => {
		const dark = image([[grey(10), grey(55), [255, 255, 255, 0]]]);
		expect([...quantize(prepare(dark, { stretch: true }), GAMEBOY).pixels]).toEqual([0, 3, CLEAR]);
	});
});
