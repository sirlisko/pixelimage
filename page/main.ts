import { type Img, paint } from "../src/image.ts";
import { centredSquare, renderer } from "../src/render.ts";
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

for (const [slug, { name }] of Object.entries(PALETTES)) palette.add(new Option(name, slug));
palette.value = "endesga-32";

const render = renderer();
let source: Img | undefined;

const chosenSize = () => (size.value === "custom" ? Math.min(256, Math.max(4, Number(custom.value) || 32)) : Number(size.value));

const update = () => {
	$<HTMLLabelElement>("custom-field").hidden = size.value !== "custom";
	if (!source) return;
	const colors = paletteOf(palette.value).colors;
	const sprite = render(source, { crop: centredSquare(source), size: chosenSize(), colors, stretch: stretch.checked });
	preview.width = sprite.width;
	preview.height = sprite.height;
	const img = paint(sprite, colors);
	(preview.getContext("2d") as CanvasRenderingContext2D).putImageData(new ImageData(img.data, img.width), 0, 0);
};

const open = async (file: File) => {
	status.textContent = "";
	try {
		source = await decode(file);
	} catch (err) {
		status.textContent = (err as Error).message;
		return;
	}
	empty.hidden = true;
	workspace.hidden = false;
	update();
};

listenForImages($<HTMLInputElement>("file"), open);
$<HTMLFormElement>("controls").addEventListener("input", update);
