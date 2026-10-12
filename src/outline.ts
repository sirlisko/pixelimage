import { fromHex, oklab } from "./color.ts";
import { CLEAR, type Sprite } from "./image.ts";

/**
 * Adds a 1px outline in palette colour `index` around everything opaque: each transparent pixel touching the shape
 * sideways is filled. Diagonal neighbours don't count, which keeps the outline 1px thick at corners.
 */
export const outline = (sprite: Sprite, index: number): Sprite => {
	const { width, height, pixels } = sprite;
	const out = pixels.slice();
	const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && pixels[y * width + x] !== CLEAR;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (pixels[y * width + x] !== CLEAR) continue;
			if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) out[y * width + x] = index;
		}
	}
	return { ...sprite, pixels: out };
};

/** The palette colour with the lowest lightness. */
export const darkest = (colors: string[]) => {
	const levels = colors.map((c) => oklab(fromHex(c))[0]);
	return levels.indexOf(Math.min(...levels));
};
