import type { Dither } from "../src/dither.ts";
import type { Edits } from "../src/edits.ts";
import type { Rect } from "../src/image.ts";
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
	edits: [string, [number, number][]][];
}

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
