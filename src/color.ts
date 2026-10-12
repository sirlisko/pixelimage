export type Rgb = [number, number, number];
export type Lab = [number, number, number];

export const fromHex = (hex: string): Rgb => {
	const h = hex.replace("#", "");
	return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as Rgb;
};

export const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

export const toLinear = (c: number) => {
	const v = c / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export const fromLinear = (v: number) => {
	const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
	return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

/** sRGB byte → linear light, precomputed since every source pixel goes through it. */
export const LINEAR = Float32Array.from({ length: 256 }, (_, i) => toLinear(i));

export const oklabLinear = (lr: number, lg: number, lb: number): Lab => {
	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
};

/** Perceptual lightness and hue axes, so "nearest" matches what the eye sees rather than RGB distance. */
export const oklab = ([r, g, b]: Rgb): Lab => oklabLinear(LINEAR[r], LINEAR[g], LINEAR[b]);

export const distance = ([l1, a1, b1]: Lab, [l2, a2, b2]: Lab) => Math.hypot(l1 - l2, a1 - a2, b1 - b2);

// Below this chroma a colour is a grey, and its hue is noise.
const GREY = 0.03;
// How tightly the hues must agree (1 = identical) for the palette to count as one hue.
const ONE_HUE = 0.9;

/**
 * True when the palette is shades of a single hue, like the Game Boy's greens. Matching those by hue would send
 * every colour to the same shade, so they're matched by lightness instead.
 */
export const isRamp = (colors: string[]) => {
	const hues = colors
		.map((c) => oklab(fromHex(c)))
		.filter(([, a, b]) => Math.hypot(a, b) > GREY)
		.map(([, a, b]) => Math.atan2(b, a));
	if (hues.length < 2) return true;
	const x = hues.reduce((sum, h) => sum + Math.cos(h), 0) / hues.length;
	const y = hues.reduce((sum, h) => sum + Math.sin(h), 0) / hues.length;
	return Math.hypot(x, y) > ONE_HUE;
};
