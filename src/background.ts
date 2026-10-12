import { distance, type Lab, LINEAR, oklabLinear } from "./color.ts";
import type { Img } from "./image.ts";

export interface Point {
	x: number;
	y: number;
}

const labAt = ({ data }: Img, i: number): Lab => oklabLinear(LINEAR[data[i * 4]], LINEAR[data[i * 4 + 1]], LINEAR[data[i * 4 + 2]]);

/**
 * Marks the background: the pixels reachable from each seed (sideways, not diagonally) whose colour is within
 * `tolerance` of the seed's, in OKLab. Comparing with the seed rather than the neighbour stops a soft gradient from
 * leaking the fill into the subject.
 */
export const backgroundMask = (img: Img, seeds: Point[], tolerance: number) => {
	const { width, height } = img;
	const mask = new Uint8Array(width * height);
	for (const seed of seeds) {
		const sx = Math.floor(seed.x);
		const sy = Math.floor(seed.y);
		if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
		const start = sy * width + sx;
		const target = labAt(img, start);
		const seen = new Uint8Array(width * height);
		const stack = [start];
		seen[start] = 1;
		while (stack.length) {
			const i = stack.pop() as number;
			if (distance(labAt(img, i), target) > tolerance) continue;
			mask[i] = 1;
			const x = i % width;
			const y = Math.floor(i / width);
			for (const [nx, ny] of [
				[x - 1, y],
				[x + 1, y],
				[x, y - 1],
				[x, y + 1],
			]) {
				const n = ny * width + nx;
				if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[n]) continue;
				seen[n] = 1;
				stack.push(n);
			}
		}
	}
	return mask;
};

/** A copy of the image with the masked pixels made transparent. */
export const clearMasked = (img: Img, mask: Uint8Array): Img => {
	const data = img.data.slice();
	mask.forEach((m, i) => {
		if (m) data[i * 4 + 3] = 0;
	});
	return { width: img.width, height: img.height, data };
};
