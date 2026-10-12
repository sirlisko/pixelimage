import { squareCrop } from "../src/crop.ts";
import type { Dither } from "../src/dither.ts";
import { applyEdits, type Edits, editKey } from "../src/edits.ts";
import { toGpl } from "../src/gpl.ts";
import { fullRect, type Img, paint, type Rect, type Sprite } from "../src/image.ts";
import { centredSquare, outputSize, renderer } from "../src/render.ts";
import { cropper } from "./crop.ts";
import { editor } from "./editor.ts";
import { download, png } from "./export.ts";
import { decode, listenForImages } from "./load.ts";
import { renderOptions, wirePicker } from "./palette-picker.ts";
import { paletteOf } from "./palettes.ts";
import { wireTools } from "./tools.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const status = $<HTMLParagraphElement>("status");
const workspace = $<HTMLDivElement>("workspace");
const empty = $<HTMLElement>("empty");
const size = $<HTMLSelectElement>("size");
const custom = $<HTMLInputElement>("custom");
const palette = $<HTMLSelectElement>("palette");
const stretch = $<HTMLInputElement>("stretch");
const dither = $<HTMLSelectElement>("dither");
const preview = $<HTMLCanvasElement>("preview");
const square = $<HTMLInputElement>("square");

let slug = "endesga-32";
renderOptions(palette, slug);

const render = renderer();
let source: Img | undefined;
let crop: Rect = { x: 0, y: 0, width: 1, height: 1 };
let sourceUrl = "";
let sourceName = "image";
let sprite: Sprite | undefined;
const store = new Map<string, Edits>();

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

const currentEdits = () => {
	const { width, height } = outputSize({ crop, size: chosenSize() });
	const key = editKey(crop, width, height, slug);
	if (!store.has(key)) store.set(key, new Map());
	return store.get(key) as Edits;
};

const edit = editor(preview, {
	shown: () => sprite,
	edits: currentEdits,
	changed: schedule,
	picked: (index) => tools.picked(index),
});
const tools = wireTools(preview.parentElement as HTMLElement, edit);
tools.setColors(paletteOf(slug).colors);

const update = () => {
	$<HTMLLabelElement>("custom-field").hidden = size.value !== "custom";
	if (!source) return;
	const { colors } = paletteOf(slug);
	const base = render(source, {
		crop,
		size: chosenSize(),
		colors,
		stretch: stretch.checked,
		dither: dither.value as Dither,
	});
	sprite = applyEdits(base, currentEdits());
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
	sourceName = file.name.replace(/\.[^.]+$/, "") || "image";
	URL.revokeObjectURL(sourceUrl);
	sourceUrl = URL.createObjectURL(file);
	store.clear();
	crop = initialCrop(source);
	crops.show(sourceUrl, source, crop);
	empty.hidden = true;
	workspace.hidden = false;
	update();
};

listenForImages([$<HTMLInputElement>("file"), $<HTMLInputElement>("replace")], open);
$<HTMLFormElement>("controls").addEventListener("input", (e) => {
	if (e.target !== palette) schedule();
});
wirePicker(palette, $("lospec"), $<HTMLInputElement>("lospec-slug"), (picked) => {
	slug = picked;
	tools.setColors(paletteOf(slug).colors);
	schedule();
});
square.addEventListener("change", () => {
	crops.setSquare(square.checked);
	if (square.checked) crops.set(squareCrop(crop));
});
$<HTMLButtonElement>("reset-crop").addEventListener("click", () => {
	if (source) crops.set(initialCrop(source));
});

$<HTMLButtonElement>("save-png").addEventListener("click", async () => {
	if (!sprite) return;
	const scale = Number($<HTMLSelectElement>("scale").value);
	const suffix = scale === 1 ? "" : `@${scale}x`;
	download(`${sourceName}-${sprite.width}${suffix}.png`, await png(sprite, paletteOf(slug).colors, scale), "image/png");
});
$<HTMLButtonElement>("save-gpl").addEventListener("click", () => {
	const { name, colors } = paletteOf(slug);
	download(`${slug}.gpl`, toGpl(name, colors), "text/plain");
});
