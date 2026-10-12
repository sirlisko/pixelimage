import { moveCrop, spanCrop } from "../src/crop.ts";
import type { Rect } from "../src/image.ts";

type Size = { width: number; height: number };

/**
 * Crop box over the source image: drag inside it to move it, drag its corner handle to resize it, or drag anywhere
 * else to draw a new one. Everything is in source pixels; the box is placed in percentages so it follows the image
 * when the page reflows.
 */
export const cropper = (root: HTMLElement, onChange: (crop: Rect) => void) => {
	const img = root.querySelector("img") as HTMLImageElement;
	const box = root.querySelector(".crop") as HTMLElement;
	const handle = root.querySelector(".handle") as HTMLElement;
	let bounds: Size = { width: 1, height: 1 };
	let crop: Rect = { x: 0, y: 0, width: 1, height: 1 };
	let square = true;

	const draw = () => {
		Object.assign(box.style, {
			left: `${(crop.x / bounds.width) * 100}%`,
			top: `${(crop.y / bounds.height) * 100}%`,
			width: `${(crop.width / bounds.width) * 100}%`,
			height: `${(crop.height / bounds.height) * 100}%`,
		});
	};

	const set = (next: Rect) => {
		crop = next;
		draw();
		onChange(crop);
	};

	const toSource = (e: PointerEvent) => {
		const r = img.getBoundingClientRect();
		return {
			x: ((e.clientX - r.left) / r.width) * bounds.width,
			y: ((e.clientY - r.top) / r.height) * bounds.height,
		};
	};

	root.addEventListener("pointerdown", (e) => {
		if (e.button !== 0) return;
		e.preventDefault();
		root.setPointerCapture(e.pointerId);
		const start = toSource(e);
		const inside =
			start.x >= crop.x && start.x <= crop.x + crop.width && start.y >= crop.y && start.y <= crop.y + crop.height;
		const fixed = e.target === handle ? { x: crop.x, y: crop.y } : start;
		const from = crop;
		const drag = (m: PointerEvent) => {
			const at = toSource(m);
			if (e.target !== handle && inside) set(moveCrop(from, at.x - start.x, at.y - start.y, bounds));
			else set(spanCrop(fixed, at, bounds, square));
		};
		const stop = () => {
			root.removeEventListener("pointermove", drag);
			root.removeEventListener("pointerup", stop);
			root.removeEventListener("pointercancel", stop);
		};
		root.addEventListener("pointermove", drag);
		root.addEventListener("pointerup", stop);
		root.addEventListener("pointercancel", stop);
	});

	return {
		show(url: string, size: Size, initial: Rect) {
			img.src = url;
			bounds = size;
			crop = initial;
			draw();
		},
		set,
		setSquare(on: boolean) {
			square = on;
		},
	};
};
