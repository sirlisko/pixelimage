import { describe, expect, test } from "vitest";
import { CLEAR } from "../src/image.ts";
import { darkest, outline } from "../src/outline.ts";
import { PICO8 } from "./palettes.ts";

const _ = CLEAR;

describe("outline", () => {
	test("rings the shape sideways, leaving the corners empty", () => {
		const dot = { width: 3, height: 3, pixels: Int16Array.from([_, _, _, _, 1, _, _, _, _]) };
		expect([...outline(dot, 0).pixels]).toEqual([_, 0, _, 0, 1, 0, _, 0, _]);
	});

	test("leaves the shape itself alone", () => {
		const bar = { width: 3, height: 1, pixels: Int16Array.from([1, 2, _]) };
		expect([...outline(bar, 0).pixels]).toEqual([1, 2, 0]);
	});
});

test("darkest picks the lowest lightness", () => {
	expect(PICO8[darkest(PICO8)]).toBe("#000000");
});
