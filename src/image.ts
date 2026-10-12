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
