import type { Prepared } from "./quantize.ts";

export type Dither = "none" | "floyd" | "bayer";

// Below this lightness range a 3×3 area is flat, and dithering turns a smooth gradient into a checkerboard.
const FLAT = 0.03;
// Above this colour distance a 3×3 area holds an edge, and dithering puts a halo along it. Colour rather than
// lightness, so edges where only the hue changes count too.
const EDGE = 0.35;

/** Marks pixels that shouldn't be dithered: flat areas and strong edges. */
export const plainPixels = ({ width, height, lab, opaque }: Prepared) => {
	const plain = new Uint8Array(width * height);
	const near: number[] = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (!opaque[i]) continue;
			near.length = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx >= 0 && ny >= 0 && nx < width && ny < height && opaque[ny * width + nx]) near.push(ny * width + nx);
				}
			}
			let lo = Number.POSITIVE_INFINITY;
			let hi = Number.NEGATIVE_INFINITY;
			let spread = 0;
			for (const a of near) {
				lo = Math.min(lo, lab[a * 3]);
				hi = Math.max(hi, lab[a * 3]);
				for (const b of near) {
					const d = Math.hypot(lab[a * 3] - lab[b * 3], lab[a * 3 + 1] - lab[b * 3 + 1], lab[a * 3 + 2] - lab[b * 3 + 2]);
					spread = Math.max(spread, d);
				}
			}
			if (hi - lo < FLAT || spread > EDGE) plain[i] = 1;
		}
	}
	return plain;
};

// Floyd–Steinberg: where the error goes, as [dx, dy, share].
const SPREAD = [
	[1, 0, 7 / 16],
	[-1, 1, 3 / 16],
	[0, 1, 5 / 16],
	[1, 1, 1 / 16],
];

/**
 * Picks each pixel's colour after adding the error left over from the pixels before it. `target` is in the palette's
 * space and is consumed. `damp` scales the error down, since full-strength diffusion speckles full-colour palettes.
 */
export const floyd = (
	{ width, height, opaque }: Prepared,
	target: Float32Array,
	plain: Uint8Array,
	nearest: (l: number, a: number, b: number) => number,
	labs: number[][],
	damp: number,
	pixels: Int16Array,
) => {
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (!opaque[i]) continue;
			const p = i * 3;
			const index = nearest(target[p], target[p + 1], target[p + 2]);
			pixels[i] = index;
			if (plain[i]) continue;
			const error = [0, 1, 2].map((c) => (target[p + c] - labs[index][c]) * damp);
			for (const [dx, dy, share] of SPREAD) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || nx >= width || ny >= height) continue;
				const n = ny * width + nx;
				if (!opaque[n] || plain[n]) continue;
				for (let c = 0; c < 3; c++) target[n * 3 + c] += error[c] * share;
			}
		}
	}
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ordered dithering: nudges each pixel's lightness by a fixed 4×4 pattern scaled to `spread`, then picks. */
export const bayer = (
	{ width, height, opaque }: Prepared,
	target: Float32Array,
	plain: Uint8Array,
	nearest: (l: number, a: number, b: number) => number,
	spread: number,
	pixels: Int16Array,
) => {
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (!opaque[i]) continue;
			const nudge = plain[i] ? 0 : ((BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5) * spread;
			pixels[i] = nearest(target[i * 3] + nudge, target[i * 3 + 1], target[i * 3 + 2]);
		}
	}
};
