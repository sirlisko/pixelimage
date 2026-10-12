import type { Img, Rect, Sprite } from "./image.ts";
import { prepare, quantize } from "./quantize.ts";
import { downscale } from "./resize.ts";

export interface Settings {
	crop: Rect;
	/** Output width in pixels. The height follows the crop's aspect ratio. */
	size: number;
	colors: string[];
	stretch: boolean;
}

export const outputSize = ({ crop, size }: Pick<Settings, "crop" | "size">) => ({
	width: size,
	height: Math.max(1, Math.round((size * crop.height) / crop.width)),
});

/** The largest square in the middle of the image. */
export const centredSquare = ({ width, height }: Img): Rect => {
	const side = Math.min(width, height);
	return { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };
};

/** Keeps the last downscale, since it's the slow step and most setting changes don't need a new one. */
export const renderer = () => {
	let last: { source: Img; key: string; small: Img } | undefined;
	return (source: Img, settings: Settings): Sprite => {
		const { width, height } = outputSize(settings);
		const key = JSON.stringify([settings.crop, width, height]);
		if (last?.source !== source || last.key !== key) {
			last = { source, key, small: downscale(source, settings.crop, width, height) };
		}
		return quantize(prepare(last.small, settings), settings.colors);
	};
};
