import { describe, expect, test } from "vitest";
import { applyEdits, editKey, line, mirrorIndex, region } from "../src/edits.ts";
import { CLEAR, type Sprite } from "../src/image.ts";

const sprite = (rows: number[][]): Sprite => ({
	width: rows[0].length,
	height: rows.length,
	pixels: Int16Array.from(rows.flat()),
});

describe("edits", () => {
	test("apply on top of the sprite without changing it", () => {
		const base = sprite([[0, 1, 2]]);
		const edited = applyEdits(base, new Map([[0, 2], [2, CLEAR]]));
		expect([...edited.pixels]).toEqual([2, 1, CLEAR]);
		expect([...base.pixels]).toEqual([0, 1, 2]);
	});

	test("ignore pixels outside a smaller sprite", () => {
		expect([...applyEdits(sprite([[0]]), new Map([[5, 1]])).pixels]).toEqual([0]);
	});

	test("are keyed by crop, size and palette, ignoring sub-pixel crop drift", () => {
		const crop = { x: 10.2, y: 0, width: 100, height: 100 };
		expect(editKey(crop, 32, 32, "pico-8")).toBe(editKey({ ...crop, x: 9.9 }, 32, 32, "pico-8"));
		expect(editKey(crop, 32, 32, "pico-8")).not.toBe(editKey(crop, 16, 16, "pico-8"));
		expect(editKey(crop, 32, 32, "pico-8")).not.toBe(editKey(crop, 32, 32, "endesga-32"));
	});
});

describe("region", () => {
	test("spreads sideways but not diagonally", () => {
		const s = sprite([
			[1, 1, 0],
			[0, 1, 0],
			[1, 0, 1],
		]);
		expect(region(s, 0).sort()).toEqual([0, 1, 4]);
	});

	test("fills transparent areas too", () => {
		expect(region(sprite([[CLEAR, CLEAR, 0]]), 1).sort()).toEqual([0, 1]);
	});
});

describe("line", () => {
	test("joins two points without gaps", () => {
		expect(line(0, 0, 3, 1)).toEqual([
			[0, 0],
			[1, 0],
			[2, 1],
			[3, 1],
		]);
		expect(line(2, 2, 2, 2)).toEqual([[2, 2]]);
	});
});

test("mirrorIndex reflects across the vertical middle", () => {
	// Row 1 of a 4-wide sprite: pixels 4..7.
	expect([4, 5, 6, 7].map((i) => mirrorIndex(i, 4))).toEqual([7, 6, 5, 4]);
	// The middle column of an odd width mirrors onto itself.
	expect(mirrorIndex(1, 3)).toBe(1);
});
