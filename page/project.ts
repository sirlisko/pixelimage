import type { Dither } from "../src/dither.ts";
import type { Edits } from "../src/edits.ts";
import type { Rect } from "../src/image.ts";
import type { Background } from "../src/render.ts";
import type { Palette } from "./palettes.ts";

/** Everything needed to pick up where you left off. */
export interface Project {
	name: string;
	image: Blob;
	crop: Rect;
	square: boolean;
	/** The size menu's value: a number, or "custom" with the number in `custom`. */
	size: string;
	custom: number;
	slug: string;
	/** Kept with the project, so a Lospec palette opens offline and doesn't change under your edits. */
	palette: Palette;
	stretch: boolean;
	dither: Dither;
	/** At most this many palette colours, or 0 for no limit. */
	cap: number;
	/** The outline menu's value: "" for none, "darkest", or a palette index. */
	outline: string;
	background: Background;
	edits: [string, [number, number][]][];
}

export const NO_BACKGROUND: Background = { seeds: [], tolerance: 0.1 };

export const packEdits = (store: Map<string, Edits>): Project["edits"] =>
	[...store].filter(([, edits]) => edits.size).map(([key, edits]) => [key, [...edits]]);

export const unpackEdits = (packed: Project["edits"]) => new Map(packed.map(([key, edits]) => [key, new Map(edits)]));

const DB = "pixelimage";
const STORE = "projects";
const CURRENT = "current";

const db = () =>
	new Promise<IDBDatabase>((resolve, reject) => {
		const req = indexedDB.open(DB, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});

const request = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => {
	const conn = await db();
	return new Promise<T>((resolve, reject) => {
		const req = run(conn.transaction(STORE, mode).objectStore(STORE));
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	}).finally(() => conn.close());
};

/** Storage can be unavailable (private windows, blocked site data), so failures leave the page working without it. */
export const saveCurrent = (project: Project) => request("readwrite", (s) => s.put(project, CURRENT)).catch(() => {});

export const loadCurrent = () =>
	request<Project | undefined>("readonly", (s) => s.get(CURRENT)).catch(() => undefined);

const FORMAT = "pixelimage";
export const EXTENSION = ".pixelimage.json";

const toDataUrl = async (blob: Blob) => {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	let binary = "";
	// In chunks, since spreading a whole photo into one call overflows the stack.
	for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
};

/** The project as one JSON file, image included, to keep or move to another browser. */
export const toFile = async (project: Project) =>
	JSON.stringify({ format: FORMAT, version: 1, ...project, image: await toDataUrl(project.image) });

const isRect = (r: unknown): r is Rect =>
	typeof r === "object" && r !== null && ["x", "y", "width", "height"].every((k) => Number.isFinite((r as never)[k]));

const readBackground = (b: unknown): Background => {
	const { seeds, tolerance } = (b ?? {}) as Partial<Background>;
	if (!Array.isArray(seeds) || !Number.isFinite(tolerance)) return NO_BACKGROUND;
	return { seeds: seeds.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y)), tolerance: tolerance as number };
};

/** Reads a project file, refusing anything that isn't one rather than half-loading it. */
export const fromFile = async (text: string): Promise<Project> => {
	const bad = new Error("That file isn't a pixelimage project.");
	let data: Record<string, unknown>;
	try {
		data = JSON.parse(text);
	} catch {
		throw bad;
	}
	const palette = data.palette as Palette | undefined;
	const valid =
		data.format === FORMAT &&
		typeof data.image === "string" &&
		data.image.startsWith("data:image/") &&
		isRect(data.crop) &&
		typeof data.slug === "string" &&
		Array.isArray(palette?.colors) &&
		palette.colors.length > 0 &&
		palette.colors.every((c) => typeof c === "string" && /^#[0-9a-f]{6}$/.test(c)) &&
		Array.isArray(data.edits);
	if (!valid) throw bad;
	const image = await (await fetch(data.image as string)).blob();
	return {
		name: String(data.name || "image"),
		image,
		crop: data.crop as Rect,
		square: Boolean(data.square),
		size: String(data.size),
		custom: Number(data.custom) || 32,
		slug: data.slug as string,
		palette: { name: String(palette.name || data.slug), colors: palette.colors },
		stretch: Boolean(data.stretch),
		dither: (["none", "floyd", "bayer"].includes(data.dither as string) ? data.dither : "none") as Dither,
		cap: Math.max(0, Math.floor(Number(data.cap) || 0)),
		outline: /^(darkest|\d+)$/.test(String(data.outline)) ? String(data.outline) : "",
		background: readBackground(data.background),
		edits: data.edits as Project["edits"],
	};
};
