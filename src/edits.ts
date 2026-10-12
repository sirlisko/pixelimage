import type { Rect, Sprite } from "./image.ts";

/** Pixel index → palette index, or CLEAR. Kept as a diff so edits survive changes to the conversion settings. */
export type Edits = Map<number, number>;

/**
 * Edits hold pixel positions and palette indexes, so they only mean the same thing for the same crop, size and
 * palette. Each combination keeps its own, and going back to one brings its edits back.
 */
export const editKey = (crop: Rect, width: number, height: number, palette: string) =>
	[crop.x, crop.y, crop.width, crop.height].map((v) => Math.round(v)).join(",") + `~${width}x${height}~${palette}`;

export const applyEdits = (sprite: Sprite, edits: Edits | undefined): Sprite => {
	if (!edits?.size) return sprite;
	const pixels = sprite.pixels.slice();
	for (const [i, index] of edits) if (i < pixels.length) pixels[i] = index;
	return { ...sprite, pixels };
};

/** The pixels connected to `start` (sideways, not diagonally) that share its index, for the fill tool. */
export const region = ({ width, height, pixels }: Sprite, start: number) => {
	const match = pixels[start];
	const seen = new Uint8Array(pixels.length);
	const found: number[] = [];
	const stack = [start];
	seen[start] = 1;
	while (stack.length) {
		const i = stack.pop() as number;
		found.push(i);
		const x = i % width;
		const y = Math.floor(i / width);
		for (const [nx, ny] of [
			[x - 1, y],
			[x + 1, y],
			[x, y - 1],
			[x, y + 1],
		]) {
			const n = ny * width + nx;
			if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[n] || pixels[n] !== match) continue;
			seen[n] = 1;
			stack.push(n);
		}
	}
	return found;
};

/** Every pixel on the line between two points (Bresenham), so a fast pencil drag doesn't leave gaps. */
export const line = (x0: number, y0: number, x1: number, y1: number) => {
	const points: [number, number][] = [];
	const dx = Math.abs(x1 - x0);
	const dy = -Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx + dy;
	let x = x0;
	let y = y0;
	for (;;) {
		points.push([x, y]);
		if (x === x1 && y === y1) return points;
		const e2 = 2 * err;
		if (e2 >= dy) {
			err += dy;
			x += sx;
		}
		if (e2 <= dx) {
			err += dx;
			y += sy;
		}
	}
};

/** The pixel in the same row, the same distance from the other side, for mirrored drawing. */
export const mirrorIndex = (i: number, width: number) => {
	const x = i % width;
	return i - x + (width - 1 - x);
};
