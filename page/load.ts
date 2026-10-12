import type { Img } from "../src/image.ts";

export const decode = async (blob: Blob): Promise<Img> => {
	const bitmap = await createImageBitmap(blob).catch(() => {
		throw new Error("That file isn't an image this browser can read.");
	});
	const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
	const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const isProject = (file: File) => file.name.endsWith(".json");

const usable = (files: FileList | null | undefined) =>
	[...(files ?? [])].find((f) => f.type.startsWith("image/") || isProject(f));

/** Calls `onFile` for an image or project picked with one of `inputs`, pasted anywhere, or dropped anywhere. */
export const listenForFiles = (inputs: HTMLInputElement[], onFile: (file: File) => void) => {
	for (const input of inputs) {
		input.addEventListener("change", () => {
			const file = usable(input.files);
			if (file) onFile(file);
			input.value = "";
		});
	}
	window.addEventListener("paste", (e) => {
		if (e.target instanceof HTMLInputElement && e.target.type !== "file") return;
		const file = usable(e.clipboardData?.files);
		if (file) {
			e.preventDefault();
			onFile(file);
		}
	});
	window.addEventListener("dragover", (e) => {
		e.preventDefault();
		document.body.classList.add("dragging");
	});
	window.addEventListener("dragleave", (e) => {
		if (!e.relatedTarget) document.body.classList.remove("dragging");
	});
	window.addEventListener("drop", (e) => {
		e.preventDefault();
		document.body.classList.remove("dragging");
		const file = usable(e.dataTransfer?.files);
		if (file) onFile(file);
	});
};
