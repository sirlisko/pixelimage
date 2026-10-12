import type { Lab } from "./color.ts";
import { CLEAR, type Sprite } from "./image.ts";

/** How many pixels use each palette colour. */
export const usage = ({ pixels }: Sprite, count: number) => {
	const counts = new Array<number>(count).fill(0);
	for (const p of pixels) if (p !== CLEAR) counts[p]++;
	return counts;
};

/**
 * Picks at most `cap` palette colours: drops the least-used colour, hands its pixels to the nearest colour left,
 * and repeats. Picking the most-used colours outright would keep near-duplicates and lose small, distinct details.
 */
export const keepColors = (counts: number[], labs: Lab[], cap: number, ramp: boolean) => {
	const left = counts.map((c, i) => [i, c]).filter(([, c]) => c > 0);
	const gap = (a: number, b: number) =>
		ramp
			? Math.abs(labs[a][0] - labs[b][0])
			: Math.hypot(labs[a][0] - labs[b][0], labs[a][1] - labs[b][1], labs[a][2] - labs[b][2]);
	while (left.length > Math.max(1, cap)) {
		let least = 0;
		for (let i = 1; i < left.length; i++) if (left[i][1] < left[least][1]) least = i;
		const [dropped, count] = left.splice(least, 1)[0];
		let nearest = 0;
		for (let i = 1; i < left.length; i++) if (gap(left[i][0], dropped) < gap(left[nearest][0], dropped)) nearest = i;
		left[nearest][1] += count;
	}
	return left.map(([i]) => i).sort((a, b) => a - b);
};
