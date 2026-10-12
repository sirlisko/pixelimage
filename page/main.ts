import { squareCrop } from "../src/crop.ts";
import { fullRect, type Img, paint, type Rect } from "../src/image.ts";
import { centredSquare, renderer } from "../src/render.ts";
import { cropper } from "./crop.ts";
import { decode, listenForImages } from "./load.ts";
import { PALETTES, paletteOf } from "./palettes.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const status = $<HTMLParagraphElement>("status");
const workspace = $<HTMLDivElement>("workspace");
const empty = $<HTMLElement>("empty");
const size = $<HTMLSelectElement>("size");
const custom = $<HTMLInputElement>("custom");
const palette = $<HTMLSelectElement>("palette");
const stretch = $<HTMLInputElement>("stretch");
const preview = $<HTMLCanvasElement>("preview");
const square = $<HTMLInputElement>("square");

for (const [slug, { name }] of Object.entries(PALETTES)) palette.add(new Option(name, slug));
palette.value = "endesga-32";

const render = renderer();
let source: Img | undefined;
let crop: Rect = { x: 0, y: 0, width: 1, height: 1 };
let sourceUrl = "";

const chosenSize = () => (size.value === "custom" ? Math.min(256, Math.max(4, Number(custom.value) || 32)) : Number(size.value));

let pending = 0;
/** Coalesces bursts of input, like dragging the crop, into one render per frame. */
const schedule = () => {
	cancelAnimationFrame(pending);
	pending = requestAnimationFrame(update);
};

const crops = cropper($<HTMLDivElement>("source"), (next) => {
	crop = next;
	schedule();
});

const update = () => {
	$<HTMLLabelElement>("custom-field").hidden = size.value !== "custom";
	if (!source) return;
	const colors = paletteOf(palette.value).colors;
	const sprite = render(source, { crop, size: chosenSize(), colors, stretch: stretch.checked });
	preview.width = sprite.width;
	preview.height = sprite.height;
	const img = paint(sprite, colors);
	(preview.getContext("2d") as CanvasRenderingContext2D).putImageData(new ImageData(img.data, img.width), 0, 0);
};

const initialCrop = (img: Img) => (square.checked ? centredSquare(img) : fullRect(img));

const open = async (file: File) => {
	status.textContent = "";
	try {
		source = await decode(file);
	} catch (err) {
		status.textContent = (err as Error).message;
		return;
	}
	URL.revokeObjectURL(sourceUrl);
	sourceUrl = URL.createObjectURL(file);
	crop = initialCrop(source);
	crops.show(sourceUrl, source, crop);
	empty.hidden = true;
	workspace.hidden = false;
	update();
};

listenForImages([$<HTMLInputElement>("file"), $<HTMLInputElement>("replace")], open);
$<HTMLFormElement>("controls").addEventListener("input", schedule);
square.addEventListener("change", () => {
	crops.setSquare(square.checked);
	if (square.checked) crops.set(squareCrop(crop));
});
$<HTMLButtonElement>("reset-crop").addEventListener("click", () => {
	if (source) crops.set(initialCrop(source));
});
