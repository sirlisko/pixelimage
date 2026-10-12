import { describe, expect, test } from "vitest";
import { backgroundMask, clearMasked } from "../src/background.ts";
import { image, pixel } from "./image.ts";

type Rgba = [number, number, number, number];
const W: Rgba = [255, 255, 255, 255];
const w: Rgba = [245, 245, 240, 255];
const R: Rgba = [200, 30, 40, 255];

describe("backgroundMask", () => {
	test("fills the connected area of similar colour", () => {
		const plate = image([
			[W, w, W],
			[W, R, W],
			[R, R, W],
		]);
		expect([...backgroundMask(plate, [{ x: 0, y: 0 }], 0.05)]).toEqual([1, 1, 1, 1, 0, 1, 0, 0, 1]);
	});

	test("stops at the tolerance", () => {
		const plate = image([[W, w, R]]);
		expect([...backgroundMask(plate, [{ x: 0, y: 0 }], 0.001)]).toEqual([1, 0, 0]);
	});

	test("doesn't reach separate areas without their own seed", () => {
		const split = image([[W, R, W]]);
		expect([...backgroundMask(split, [{ x: 0, y: 0 }], 0.05)]).toEqual([1, 0, 0]);
		expect([...backgroundMask(split, [{ x: 0, y: 0 }, { x: 2.5, y: 0.5 }], 0.05)]).toEqual([1, 0, 1]);
	});

	test("ignores seeds outside the image", () => {
		expect([...backgroundMask(image([[W]]), [{ x: 3, y: 0 }], 0.05)]).toEqual([0]);
	});
});

test("clearMasked makes the background transparent", () => {
	const out = clearMasked(image([[W, R]]), Uint8Array.from([1, 0]));
	expect(pixel(out, 0, 0)[3]).toBe(0);
	expect(pixel(out, 1, 0)).toEqual(R);
});
