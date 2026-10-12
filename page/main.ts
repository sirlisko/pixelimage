import { squareCrop } from "../src/crop.ts";
import type { Dither } from "../src/dither.ts";
import { applyEdits, type Edits, editKey } from "../src/edits.ts";
import { toGpl } from "../src/gpl.ts";
import { darkest, outline as addOutline } from "../src/outline.ts";
import { fullRect, type Img, paint, type Rect, type Sprite } from "../src/image.ts";
import { type Background, centredSquare, outputSize, renderer } from "../src/render.ts";
import { fitWithin } from "../src/resize.ts";
import { cropper } from "./crop.ts";
import { editor } from "./editor.ts";
import { download, png } from "./export.ts";
import { decode, isProject, listenForFiles } from "./load.ts";
import { renderOptions, wirePicker } from "./palette-picker.ts";
import { paletteOf, rememberPalette } from "./palettes.ts";
import {
	EXTENSION,
	fromFile,
	loadCurrent,
	NO_BACKGROUND,
	packEdits,
	type Project,
	saveCurrent,
	toFile,
	unpackEdits,
} from "./project.ts";
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
const cap = $<HTMLInputElement>("cap");
const outline = $<HTMLSelectElement>("outline");
const preview = $<HTMLCanvasElement>("preview");
const square = $<HTMLInputElement>("square");
const tolerance = $<HTMLInputElement>("tolerance");
const clearBackground = $<HTMLButtonElement>("clear-background");

let slug = "endesga-32";

const render = renderer();
let source: { img: Img; blob: Blob; name: string; url: string } | undefined;
let crop: Rect = { x: 0, y: 0, width: 1, height: 1 };
let sprite: Sprite | undefined;
let store = new Map<string, Edits>();
let seeds: Background["seeds"] = [];

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
	background: (x, y) => {
		seeds = [...seeds, { x: crop.x + x * crop.width, y: crop.y + y * crop.height }];
		schedule();
	},
});
const tools = wireTools(preview.parentElement as HTMLElement, edit);

const project = (): Project | undefined =>
	source && {
		name: source.name,
		image: source.blob,
		crop,
		square: square.checked,
		size: size.value,
		custom: Number(custom.value),
		slug,
		palette: paletteOf(slug),
		stretch: stretch.checked,
		dither: dither.value as Dither,
		cap: Number(cap.value) || 0,
		outline: outline.value,
		background: background(),
		edits: packEdits(store),
	};

let saving = 0;
const saveNow = () => {
	clearTimeout(saving);
	saving = 0;
	const current = project();
	if (current) saveCurrent(current);
};
const autosave = () => {
	clearTimeout(saving);
	saving = window.setTimeout(saveNow, 500);
};
// Closing the tab right after a change would otherwise lose it to the delay.
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden" && saving) saveNow();
});

const background = (): Background => ({ seeds, tolerance: Number(tolerance.value) / 100 });

const update = () => {
	$<HTMLLabelElement>("custom-field").hidden = size.value !== "custom";
	clearBackground.disabled = !seeds.length;
	if (!source) return;
	const { colors } = paletteOf(slug);
	const base = render(source.img, {
		crop,
		size: chosenSize(),
		colors,
		stretch: stretch.checked,
		dither: dither.value as Dither,
		cap: Number(cap.value) || 0,
		background: background(),
	});
	const edits = currentEdits();
	$<HTMLParagraphElement>("edits-elsewhere").hidden = edits.size > 0 || ![...store.values()].some((e) => e.size);
	const edited = applyEdits(base, edits);
	const ring = outlineIndex(colors);
	sprite = ring === undefined ? edited : addOutline(edited, ring);
	tools.showUsed(new Set(sprite.pixels));
	preview.width = sprite.width;
	preview.height = sprite.height;
	const img = paint(sprite, colors);
	(preview.getContext("2d") as CanvasRenderingContext2D).putImageData(new ImageData(img.data, img.width), 0, 0);
	autosave();
};

const initialCrop = (img: Img) => (square.checked ? centredSquare(img) : fullRect(img));

const outlineIndex = (colors: string[]) => {
	if (!outline.value) return undefined;
	return outline.value === "darkest" ? darkest(colors) : Number(outline.value);
};

/** "Darkest" follows the palette; a picked colour is an index, so it can't carry over to another palette. */
const outlineOptions = (colors: string[]) => {
	const keep = outline.value === "darkest" || (outline.value !== "" && Number(outline.value) < colors.length);
	const previous = keep ? outline.value : "";
	outline.replaceChildren(
		new Option("None", ""),
		new Option("Darkest colour", "darkest"),
		...colors.map((hex, i) => {
			const option = new Option(hex, String(i));
			option.style.background = hex;
			return option;
		}),
	);
	outline.value = previous;
};

const usePalette = (picked: string) => {
	slug = picked;
	renderOptions(palette, slug);
	tools.setColors(paletteOf(slug).colors);
	outlineOptions(paletteOf(slug).colors);
};
usePalette(slug);

// Big photos are shrunk once on load: the output is at most 256px, and shrinking a 24 MP photo on every crop drag
// is too slow to follow the pointer. Crops and background clicks are in the shrunk image's pixels.
const WORKING_SIZE = 2048;

let loads = 0;

const applySettings = (p: Project) => {
	square.checked = p.square;
	crops.setSquare(p.square);
	size.value = p.size;
	custom.value = String(p.custom);
	stretch.checked = p.stretch;
	dither.value = p.dither;
	cap.value = p.cap ? String(p.cap) : "";
	tolerance.value = String(Math.round((p.background ?? NO_BACKGROUND).tolerance * 100));
	rememberPalette(p.slug, p.palette);
	usePalette(p.slug);
	outline.value = p.outline ?? "";
};

/** Shows an image, with the settings, crop and edits of a saved project, or fresh ones. */
const show = async (blob: Blob, name: string, saved?: Project) => {
	status.textContent = "";
	const ticket = ++loads;
	let img: Img;
	try {
		img = fitWithin(await decode(blob), WORKING_SIZE);
	} catch (err) {
		if (ticket === loads) status.textContent = (err as Error).message;
		return;
	}
	// A big image can still be decoding when another one is opened; the newer one wins.
	if (ticket !== loads) return;
	if (saved) applySettings(saved);
	if (source) URL.revokeObjectURL(source.url);
	source = { img, blob, name, url: URL.createObjectURL(blob) };
	store = saved ? unpackEdits(saved.edits) : new Map();
	seeds = saved?.background?.seeds ?? [];
	crop = saved?.crop ?? initialCrop(img);
	crops.show(source.url, img, crop);
	empty.hidden = true;
	workspace.hidden = false;
	update();
};

listenForFiles([$<HTMLInputElement>("file"), $<HTMLInputElement>("replace")], async (file) => {
	if (!isProject(file)) return show(file, file.name.replace(/\.[^.]+$/, "") || "image");
	try {
		const saved = await fromFile(await file.text());
		await show(saved.image, saved.name, saved);
	} catch (err) {
		status.textContent = (err as Error).message;
	}
});
$<HTMLFormElement>("controls").addEventListener("input", (e) => {
	if (e.target !== palette) schedule();
});
wirePicker(palette, $("lospec"), $<HTMLInputElement>("lospec-slug"), (picked) => {
	usePalette(picked);
	schedule();
});
clearBackground.addEventListener("click", () => {
	seeds = [];
	schedule();
});
square.addEventListener("change", () => {
	crops.setSquare(square.checked);
	if (square.checked) crops.set(squareCrop(crop));
});
$<HTMLButtonElement>("reset-crop").addEventListener("click", () => {
	if (source) crops.set(initialCrop(source.img));
});

$<HTMLButtonElement>("save-png").addEventListener("click", async () => {
	if (!sprite || !source) return;
	const scale = Number($<HTMLSelectElement>("scale").value);
	const suffix = scale === 1 ? "" : `@${scale}x`;
	download(`${source.name}-${sprite.width}${suffix}.png`, await png(sprite, paletteOf(slug).colors, scale), "image/png");
});
$<HTMLButtonElement>("save-project").addEventListener("click", async () => {
	const current = project();
	if (current) download(`${current.name}${EXTENSION}`, await toFile(current), "application/json");
});
$<HTMLButtonElement>("save-gpl").addEventListener("click", () => {
	const { name, colors } = paletteOf(slug);
	download(`${slug}.gpl`, toGpl(name, colors), "text/plain");
});

loadCurrent().then((saved) => {
	if (saved && !source) show(saved.image, saved.name, saved);
});
