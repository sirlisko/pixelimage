import type { Img } from "../src/image.ts";

/**
 * Shows the photo over the sprite while C or the button is held, to check the conversion against what it came from.
 * `photo` gives the crop at the overlay's resolution.
 */
export const wireCompare = (button: HTMLButtonElement, overlay: HTMLCanvasElement, photo: () => Img | undefined) => {
	const show = () => {
		const img = photo();
		if (!img) return;
		overlay.width = img.width;
		overlay.height = img.height;
		(overlay.getContext("2d") as CanvasRenderingContext2D).putImageData(new ImageData(img.data, img.width), 0, 0);
		overlay.hidden = false;
		button.setAttribute("aria-pressed", "true");
	};
	const hide = () => {
		overlay.hidden = true;
		button.setAttribute("aria-pressed", "false");
	};
	button.addEventListener("pointerdown", (e) => {
		e.preventDefault();
		button.setPointerCapture(e.pointerId);
		show();
	});
	for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(type, hide);
	// Keyboard users hold Space or Enter on the button, like a press-and-hold.
	button.addEventListener("keydown", (e) => {
		if ((e.key === " " || e.key === "Enter") && !e.repeat) show();
	});
	button.addEventListener("keyup", hide);
	window.addEventListener("keydown", (e) => {
		if (e.key !== "c" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
		show();
	});
	window.addEventListener("keyup", (e) => {
		if (e.key === "c") hide();
	});
	window.addEventListener("blur", hide);
};
