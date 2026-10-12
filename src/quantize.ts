import { fromHex, LINEAR, type Lab, oklab, oklabLinear, isRamp } from "./color.ts";
import { keepColors, usage } from "./cap.ts";
import { bayer, type Dither, floyd, plainPixels } from "./dither.ts";
import { CLEAR, type Img, OPAQUE, type Sprite } from "./image.ts";

/** OKLab per pixel (three floats each), with transparent pixels marked so they're left out. */
export interface Prepared {
	width: number;
	height: number;
	lab: Float32Array;
	opaque: Uint8Array;
}

// Percentiles rather than the extremes, so a few specular highlights or black pixels don't set the range.
const LOW = 0.01;
const HIGH = 0.99;

export const prepare = (img: Img, { stretch }: { stretch: boolean }): Prepared => {
	const count = img.width * img.height;
	const lab = new Float32Array(count * 3);
	const opaque = new Uint8Array(count);
	const { data } = img;
	for (let i = 0; i < count; i++) {
		if (data[i * 4 + 3] < OPAQUE) continue;
		opaque[i] = 1;
		lab.set(oklabLinear(LINEAR[data[i * 4]], LINEAR[data[i * 4 + 1]], LINEAR[data[i * 4 + 2]]), i * 3);
	}
	if (stretch) stretchLightness(lab, opaque);
	return { width: img.width, height: img.height, lab, opaque };
};

/** Maps the image's own lightness range onto 0–1. Without it, dark images land on one or two shades. */
const stretchLightness = (lab: Float32Array, opaque: Uint8Array) => {
	const kept: number[] = [];
	opaque.forEach((o, i) => o && kept.push(lab[i * 3]));
	if (!kept.length) return;
	const levels = Float32Array.from(kept).sort();
	const lo = levels[Math.round(LOW * (levels.length - 1))];
	const hi = levels[Math.round(HIGH * (levels.length - 1))];
	if (hi - lo < 1e-3) return;
	for (let i = 0; i < opaque.length; i++) {
		if (opaque[i]) lab[i * 3] = Math.min(1, Math.max(0, (lab[i * 3] - lo) / (hi - lo)));
	}
};

export interface Matcher {
	ramp: boolean;
	/** How far apart neighbouring palette colours are in lightness, which sets how strongly Bayer dithering nudges. */
	step: number;
	/** Palette colours in OKLab. For a ramp only lightness is used. */
	labs: Lab[];
	/** Moves a pixel into the palette's space: for a ramp, 0–1 lightness onto its darkest-to-lightest range. */
	target: (l: number, a: number, b: number) => Lab;
	nearest: (l: number, a: number, b: number) => number;
}

/** `ramp` can be forced, so a capped palette is matched the same way as the palette it came from. */
export const matcher = (colors: string[], ramp = isRamp(colors)): Matcher => {
	const labs = colors.map((c) => oklab(fromHex(c)));
	if (ramp) {
		const levels = labs.map(([l]) => l);
		const min = Math.min(...levels);
		const max = Math.max(...levels);
		return {
			ramp: true,
			step: (max - min) / Math.max(1, levels.length - 1),
			labs,
			target: (l) => [min + l * (max - min), 0, 0],
			nearest: (l) => {
				let best = 0;
				for (let i = 1; i < levels.length; i++) if (Math.abs(levels[i] - l) < Math.abs(levels[best] - l)) best = i;
				return best;
			},
		};
	}
	return {
		ramp: false,
		// Roughly the lightness gap between colours if the palette were spread evenly over the colour cube.
		step: 1 / Math.cbrt(labs.length) / 2,
		labs,
		target: (l, a, b) => [l, a, b],
		nearest: (l, a, b) => {
			let best = 0;
			let bestDist = Number.POSITIVE_INFINITY;
			labs.forEach(([pl, pa, pb], i) => {
				const dist = (l - pl) ** 2 + (a - pa) ** 2 + (b - pb) ** 2;
				if (dist < bestDist) {
					bestDist = dist;
					best = i;
				}
			});
			return best;
		},
	};
};

// Full-strength error diffusion speckles full-colour palettes, where a close colour is almost always available.
const COLOUR_DAMP = 0.6;

export interface Options {
	dither?: Dither;
	/** At most this many palette colours in the image. */
	cap?: number;
}

export const quantize = (prepared: Prepared, colors: string[], { dither = "none", cap }: Options = {}): Sprite => {
	if (cap && cap < colors.length) return capped(prepared, colors, dither, cap);
	return quantizeWith(prepared, colors, dither, isRamp(colors));
};

/** Picks the colours to keep from a plain conversion, then converts again with only those, dithering included. */
const capped = (prepared: Prepared, colors: string[], dither: Dither, cap: number): Sprite => {
	const ramp = isRamp(colors);
	const plain = quantizeWith(prepared, colors, "none", ramp);
	const kept = keepColors(usage(plain, colors.length), matcher(colors, ramp).labs, cap, ramp);
	const sprite = quantizeWith(prepared, kept.map((i) => colors[i]), dither, ramp);
	sprite.pixels.forEach((p, i) => {
		if (p !== CLEAR) sprite.pixels[i] = kept[p];
	});
	return sprite;
};

const quantizeWith = (prepared: Prepared, colors: string[], dither: Dither, ramp: boolean): Sprite => {
	const { width, height, lab, opaque } = prepared;
	const match = matcher(colors, ramp);
	const target = new Float32Array(lab.length);
	for (let i = 0; i < opaque.length; i++) {
		if (opaque[i]) target.set(match.target(lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]), i * 3);
	}
	const pixels = new Int16Array(width * height).fill(CLEAR);
	// Without dithering every pixel is plain, so Floyd–Steinberg passes no error on and just picks the nearest.
	const plain = dither === "none" ? opaque : plainPixels(prepared);
	if (dither === "bayer") bayer(prepared, target, plain, match.nearest, match.step, pixels);
	else floyd(prepared, target, plain, match.nearest, match.labs, match.ramp ? 1 : COLOUR_DAMP, pixels);
	return { width, height, pixels };
};
