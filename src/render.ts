import { backgroundMask, clearMasked, type Point } from "./background.ts";
import type { Dither } from "./dither.ts";
import { fullRect, type Img, type Rect, type Sprite } from "./image.ts";
import { prepare, quantize } from "./quantize.ts";
import { downscale } from "./resize.ts";

export interface Background {
	/** Where the background was clicked, in source pixels, so the clicks survive changes to the crop. */
	seeds: Point[];
	tolerance: number;
}

export interface Settings {
	crop: Rect;
	/** Output width in pixels. The height follows the crop's aspect ratio. */
	size: number;
	colors: string[];
	stretch: boolean;
	dither: Dither;
	/** At most this many palette colours, or 0 for no limit. */
	cap: number;
	background: Background;
}

// Background removal runs on a copy of the crop this big: detailed enough for clean edges, small enough to stay quick.
const WORK = 512;

export const outputSize = ({ crop, size }: Pick<Settings, "crop" | "size">) => ({
	width: size,
	height: Math.max(1, Math.round((size * crop.height) / crop.width)),
});

/** The largest square in the middle of the image. */
export const centredSquare = ({ width, height }: Img): Rect => {
	const side = Math.min(width, height);
	return { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };
};

/** Remembers the last value made, and makes a new one only when the image or the other inputs change. */
const last = <T>() => {
	let made: { img: Img; key: string; value: T } | undefined;
	return (img: Img, inputs: unknown, make: () => T) => {
		const key = JSON.stringify(inputs);
		if (made?.img !== img || made.key !== key) made = { img, key, value: make() };
		return made.value;
	};
};

/** Renders a sprite, redoing only the steps whose inputs changed, since most setting changes need none of the slow ones. */
export const renderer = () => {
	const work = last<Img>();
	const masked = last<Img>();
	const small = last<Img>();
	return (source: Img, settings: Settings): Sprite => {
		const { crop, background } = settings;
		const { width, height } = outputSize(settings);
		let input = source;
		let rect = crop;
		if (background.seeds.length) {
			const scale = Math.min(1, WORK / Math.max(crop.width, crop.height));
			const copy = work(source, crop, () =>
				downscale(source, crop, Math.max(1, Math.round(crop.width * scale)), Math.max(1, Math.round(crop.height * scale))),
			);
			const seeds = background.seeds.map(({ x, y }) => ({
				x: ((x - crop.x) / crop.width) * copy.width,
				y: ((y - crop.y) / crop.height) * copy.height,
			}));
			input = masked(copy, [seeds, background.tolerance], () =>
				clearMasked(copy, backgroundMask(copy, seeds, background.tolerance)),
			);
			rect = fullRect(input);
		}
		const scaled = small(input, [rect, width, height], () => downscale(input, rect, width, height));
		return quantize(prepare(scaled, settings), settings.colors, settings);
	};
};
