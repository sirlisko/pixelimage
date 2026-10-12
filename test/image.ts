import type { Img } from "../src/image.ts";

type Rgba = [number, number, number, number];

/** An image from rows of RGBA pixels. */
export const image = (rows: Rgba[][]): Img => ({
	width: rows[0].length,
	height: rows.length,
	data: Uint8ClampedArray.from(rows.flat(2)),
});

export const pixel = ({ width, data }: Img, x: number, y: number) =>
	Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 4));
