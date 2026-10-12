import { paint, type Sprite } from "../src/image.ts";

export const download = (name: string, data: BlobPart, type: string) => {
	const url = URL.createObjectURL(new Blob([data], { type }));
	const a = Object.assign(document.createElement("a"), { href: url, download: name });
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** The sprite as a PNG, each pixel drawn as a `scale`×`scale` square. */
export const png = (sprite: Sprite, colors: string[], scale: number) => {
	const img = paint(sprite, colors);
	const small = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
	(small.getContext("2d") as CanvasRenderingContext2D).putImageData(new ImageData(img.data, img.width), 0, 0);
	const canvas = Object.assign(document.createElement("canvas"), {
		width: img.width * scale,
		height: img.height * scale,
	});
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
	return new Promise<Blob>((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"),
	);
};
