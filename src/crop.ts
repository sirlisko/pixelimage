import type { Rect } from "./image.ts";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Smallest crop side, in source pixels, so a stray click doesn't make an empty crop. */
export const MIN_CROP = 4;

/** Moves the crop by (dx, dy), stopping at the image's edges. */
export const moveCrop = (crop: Rect, dx: number, dy: number, bounds: { width: number; height: number }): Rect => ({
	...crop,
	x: clamp(crop.x + dx, 0, bounds.width - crop.width),
	y: clamp(crop.y + dy, 0, bounds.height - crop.height),
});

/**
 * The crop spanned by a fixed corner and a dragged one, kept inside the image. A square crop takes the longer side
 * of the drag, then shrinks to fit the space on that side of the fixed corner.
 */
export const spanCrop = (
	fixed: { x: number; y: number },
	dragged: { x: number; y: number },
	bounds: { width: number; height: number },
	square: boolean,
): Rect => {
	const toX = clamp(dragged.x, 0, bounds.width);
	const toY = clamp(dragged.y, 0, bounds.height);
	const right = toX >= fixed.x;
	const down = toY >= fixed.y;
	let width = Math.max(MIN_CROP, Math.abs(toX - fixed.x));
	let height = Math.max(MIN_CROP, Math.abs(toY - fixed.y));
	const roomX = right ? bounds.width - fixed.x : fixed.x;
	const roomY = down ? bounds.height - fixed.y : fixed.y;
	if (square) width = height = Math.min(Math.max(width, height), roomX, roomY);
	else {
		width = Math.min(width, roomX);
		height = Math.min(height, roomY);
	}
	return { x: right ? fixed.x : fixed.x - width, y: down ? fixed.y : fixed.y - height, width, height };
};

/** The same crop squared off around its centre, for when square mode is switched on. */
export const squareCrop = (crop: Rect): Rect => {
	const side = Math.min(crop.width, crop.height);
	return { x: crop.x + (crop.width - side) / 2, y: crop.y + (crop.height - side) / 2, width: side, height: side };
};
