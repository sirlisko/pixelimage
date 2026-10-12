import { describe, expect, test } from "vitest";
import { moveCrop, spanCrop, squareCrop } from "../src/crop.ts";

const bounds = { width: 100, height: 50 };

describe("moveCrop", () => {
	test("stops at the image's edges", () => {
		expect(moveCrop({ x: 10, y: 10, width: 20, height: 20 }, 200, -30, bounds)).toEqual({
			x: 80,
			y: 0,
			width: 20,
			height: 20,
		});
	});
});

describe("spanCrop", () => {
	test("spans the two corners in any direction", () => {
		expect(spanCrop({ x: 50, y: 40 }, { x: 20, y: 10 }, bounds, false)).toEqual({ x: 20, y: 10, width: 30, height: 30 });
	});

	test("keeps a free crop inside the image", () => {
		expect(spanCrop({ x: 90, y: 10 }, { x: 150, y: 80 }, bounds, false)).toEqual({ x: 90, y: 10, width: 10, height: 40 });
	});

	test("squares off on the longer side of the drag, within the room left", () => {
		expect(spanCrop({ x: 10, y: 10 }, { x: 40, y: 15 }, bounds, true)).toEqual({ x: 10, y: 10, width: 30, height: 30 });
		expect(spanCrop({ x: 10, y: 10 }, { x: 90, y: 15 }, bounds, true)).toEqual({ x: 10, y: 10, width: 40, height: 40 });
	});

	test("never collapses below the minimum", () => {
		expect(spanCrop({ x: 10, y: 10 }, { x: 10, y: 10 }, bounds, false)).toMatchObject({ width: 4, height: 4 });
	});
});

describe("squareCrop", () => {
	test("squares a crop around its centre", () => {
		expect(squareCrop({ x: 0, y: 0, width: 100, height: 50 })).toEqual({ x: 25, y: 0, width: 50, height: 50 });
	});
});
