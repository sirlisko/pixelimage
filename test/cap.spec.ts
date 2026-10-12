import { describe, expect, test } from "vitest";
import { keepColors, usage } from "../src/cap.ts";
import { fromHex, oklab } from "../src/color.ts";
import { CLEAR } from "../src/image.ts";
import { prepare, quantize } from "../src/quantize.ts";
import { image } from "./image.ts";
import { PICO8 } from "./palettes.ts";

const labs = (hexes: string[]) => hexes.map((h) => oklab(fromHex(h)));

describe("keepColors", () => {
	test("keeps everything under the cap", () => {
		expect(keepColors([5, 0, 3], labs(["#000000", "#ffffff", "#ff0000"]), 4, false)).toEqual([0, 2]);
	});

	test("merges a rare colour into its nearest neighbour, not the most common colour", () => {
		// Dark red is rare; it should fold into red, even though black is far more common.
		const colors = ["#000000", "#ff0000", "#cc0000", "#ffffff"];
		const kept = keepColors([50, 10, 2, 30], labs(colors), 3, false);
		expect(kept).toEqual([0, 1, 3]);
	});

	test("counts merged pixels towards the colour that took them", () => {
		// Light grey takes white's pixels, so it outlasts mid grey once only two can stay.
		const colors = ["#000000", "#777777", "#dddddd", "#ffffff"];
		expect(keepColors([10, 6, 5, 4], labs(colors), 2, true)).toEqual([0, 2]);
	});
});

test("usage skips transparent pixels", () => {
	expect(usage({ width: 3, height: 1, pixels: Int16Array.from([1, CLEAR, 1]) }, 2)).toEqual([0, 2]);
});

test("quantize with a cap uses at most that many colours, as indexes into the full palette", () => {
	const strip = image([
		Array.from({ length: 16 }, (_, i) => [i * 16, 255 - i * 16, (i * 37) % 256, 255] as [number, number, number, number]),
	]);
	const sprite = quantize(prepare(strip, { stretch: false }), PICO8, { cap: 3 });
	const used = new Set(sprite.pixels);
	expect(used.size).toBeLessThanOrEqual(3);
	for (const i of used) expect(i).toBeLessThan(PICO8.length);
});
