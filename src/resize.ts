import { fromLinear, LINEAR } from "./color.ts";
import { blank, type Img, type Rect } from "./image.ts";

interface Tap {
	index: number;
	weight: number;
}

/** For each output pixel, the source pixels it covers and how much of each, as a share of the output pixel. */
const taps = (start: number, size: number, out: number, limit: number): Tap[][] => {
	const scale = size / out;
	return Array.from({ length: out }, (_, i) => {
		const from = start + i * scale;
		const to = from + scale;
		const list: Tap[] = [];
		for (let s = Math.max(0, Math.floor(from)); s < Math.min(limit, Math.ceil(to)); s++) {
			const overlap = Math.min(to, s + 1) - Math.max(from, s);
			if (overlap > 0) list.push({ index: s, weight: overlap / scale });
		}
		return list;
	});
};

/**
 * Averages every source pixel under each output pixel, in linear light with premultiplied alpha. Averaging sRGB
 * values darkens fine detail, and averaging without alpha bleeds the colour of transparent pixels into the edges.
 */
export const downscale = (src: Img, rect: Rect, width: number, height: number): Img => {
	const across = taps(rect.x, rect.width, width, src.width);
	const down = taps(rect.y, rect.height, height, src.height);
	const top = Math.max(0, Math.floor(rect.y));
	const rows = Math.min(src.height, Math.ceil(rect.y + rect.height)) - top;

	const row = new Float32Array(rows * width * 4);
	for (let y = 0; y < rows; y++) {
		const line = (top + y) * src.width;
		for (let x = 0; x < width; x++) {
			const o = (y * width + x) * 4;
			for (const { index, weight } of across[x]) {
				const p = (line + index) * 4;
				const a = (src.data[p + 3] / 255) * weight;
				row[o] += LINEAR[src.data[p]] * a;
				row[o + 1] += LINEAR[src.data[p + 1]] * a;
				row[o + 2] += LINEAR[src.data[p + 2]] * a;
				row[o + 3] += a;
			}
		}
	}

	const out = blank(width, height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (const { index, weight } of down[y]) {
				const o = ((index - top) * width + x) * 4;
				r += row[o] * weight;
				g += row[o + 1] * weight;
				b += row[o + 2] * weight;
				a += row[o + 3] * weight;
			}
			const p = (y * width + x) * 4;
			if (a > 0) {
				out.data[p] = fromLinear(r / a);
				out.data[p + 1] = fromLinear(g / a);
				out.data[p + 2] = fromLinear(b / a);
			}
			out.data[p + 3] = Math.round(a * 255);
		}
	}
	return out;
};
