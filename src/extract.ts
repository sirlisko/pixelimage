import { fromOklab, type Lab, LINEAR, oklabLinear, toHex } from "./color.ts";
import { type Img, OPAQUE } from "./image.ts";

const ROUNDS = 10;

const gap = (a: Lab, b: Lab) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

const nearestOf = (lab: Lab, centres: Lab[]) => {
	let best = 0;
	for (let i = 1; i < centres.length; i++) if (gap(lab, centres[i]) < gap(lab, centres[best])) best = i;
	return best;
};

/**
 * Seeds from the pixel closest to the average, then repeatedly the pixel furthest from every seed so far. Unlike
 * random seeds it gives the same palette every time, which edits depend on, and small distinct details still get a
 * colour of their own.
 */
const seeds = (labs: Lab[], count: number) => {
	const mean: Lab = [0, 1, 2].map((c) => labs.reduce((sum, l) => sum + l[c], 0) / labs.length) as Lab;
	const centres = [labs[nearestOf(mean, labs)]];
	const far = labs.map((l) => gap(l, centres[0]));
	while (centres.length < count) {
		let pick = 0;
		for (let i = 1; i < labs.length; i++) if (far[i] > far[pick]) pick = i;
		if (far[pick] === 0) break;
		centres.push(labs[pick]);
		labs.forEach((l, i) => {
			far[i] = Math.min(far[i], gap(l, labs[pick]));
		});
	}
	return centres;
};

/** Rounds each channel to what `bits` per channel can show, like the hardware's colour registers. */
const snap = (c: number, bits: number) => {
	const steps = 2 ** bits - 1;
	return Math.round((Math.round((c / 255) * steps) * 255) / steps);
};

/**
 * Up to `count` colours that represent the image's opaque pixels, found by k-means in OKLab and sorted dark to
 * light. With `bits`, each colour is snapped to that many bits per channel, so 5 gives an SNES-like 15-bit palette.
 */
export const extractPalette = (img: Img, count: number, bits?: number): string[] => {
	const labs: Lab[] = [];
	const { data } = img;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] >= OPAQUE) labs.push(oklabLinear(LINEAR[data[i]], LINEAR[data[i + 1]], LINEAR[data[i + 2]]));
	}
	if (!labs.length) return ["#000000"];
	let centres = seeds(labs, count);
	for (let round = 0; round < ROUNDS; round++) {
		const sums = centres.map(() => [0, 0, 0, 0]);
		for (const lab of labs) {
			const sum = sums[nearestOf(lab, centres)];
			sum[0] += lab[0];
			sum[1] += lab[1];
			sum[2] += lab[2];
			sum[3]++;
		}
		centres = centres.map((c, i) => (sums[i][3] ? ([sums[i][0], sums[i][1], sums[i][2]].map((v) => v / sums[i][3]) as Lab) : c));
	}
	const hexes = centres
		.map((c) => fromOklab(c).map((v) => (bits ? snap(v, bits) : v)) as [number, number, number])
		.map(toHex);
	return [...new Set(hexes)].sort((a, b) => lightness(a) - lightness(b));
};

const lightness = (hex: string) => oklabLinear(...([1, 3, 5].map((i) => LINEAR[Number.parseInt(hex.slice(i, i + 2), 16)]) as Lab))[0];
