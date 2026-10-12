/** Same shape as ImageData, so canvas pixels can be passed in directly and tests can build their own. */
export interface Img {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const blank = (width: number, height: number): Img => ({
	width,
	height,
	data: new Uint8ClampedArray(width * height * 4),
});

export const fullRect = ({ width, height }: Img): Rect => ({ x: 0, y: 0, width, height });

export const CLEAR = -1;

/** Pixel art as palette indexes, with CLEAR where it's transparent. */
export interface Sprite {
	width: number;
	height: number;
	pixels: Int16Array;
}

/** Below this alpha a pixel counts as transparent, since the output can't be semi-transparent. */
export const OPAQUE = 128;

export const paint = ({ width, height, pixels }: Sprite, colors: string[]): Img => {
	const out = blank(width, height);
	const rgb = colors.map((c) => [0, 2, 4].map((i) => Number.parseInt(c.slice(i + 1, i + 3), 16)));
	pixels.forEach((index, i) => {
		if (index === CLEAR) return;
		out.data.set([...rgb[index], 255], i * 4);
	});
	return out;
};
