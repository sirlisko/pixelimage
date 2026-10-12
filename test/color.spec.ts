import { describe, expect, test } from "vitest";
import { fromHex, fromLinear, isRamp, oklab, toHex, toLinear } from "../src/color.ts";
import { GAMEBOY, GREYS, PICO8 } from "./palettes.ts";

describe("conversions", () => {
	test("round-trip hex", () => {
		expect(toHex(fromHex("#3e2731"))).toBe("#3e2731");
	});

	test("round-trip linear light", () => {
		for (let c = 0; c < 256; c++) expect(fromLinear(toLinear(c))).toBe(c);
	});

	test("puts black and white at the ends of lightness", () => {
		expect(oklab([0, 0, 0])[0]).toBeCloseTo(0);
		expect(oklab([255, 255, 255])[0]).toBeCloseTo(1);
	});
});

describe("isRamp", () => {
	test("treats shades of one hue as a ramp", () => {
		expect(isRamp(GAMEBOY)).toBe(true);
		expect(isRamp(GREYS)).toBe(true);
	});

	test("treats a palette of many hues as full colour", () => {
		expect(isRamp(PICO8)).toBe(false);
	});
});
