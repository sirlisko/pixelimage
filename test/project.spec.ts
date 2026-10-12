import { describe, expect, test } from "vitest";
import { fromFile, packEdits, type Project, toFile, unpackEdits } from "../page/project.ts";

test("edits survive packing, minus empty sets", () => {
	const store = new Map([
		["a", new Map([[3, 1], [7, -1]])],
		["b", new Map<number, number>()],
	]);
	expect(unpackEdits(packEdits(store))).toEqual(new Map([["a", new Map([[3, 1], [7, -1]])]]));
});

describe("project file", () => {
	const project: Project = {
		name: "lake",
		image: new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
		crop: { x: 1, y: 2, width: 30, height: 30 },
		square: true,
		size: "32",
		custom: 40,
		slug: "sweetie-16",
		palette: { name: "Sweetie 16", colors: ["#1a1c2c", "#5d275d"] },
		stretch: true,
		dither: "bayer",
		background: { seeds: [{ x: 3, y: 4 }], tolerance: 0.12 },
		edits: [["1,2,30,30~32x32~sweetie-16", [[5, 1]]]],
	};

	test("round-trips, image included", async () => {
		const back = await fromFile(await toFile(project));
		expect({ ...back, image: undefined }).toEqual({ ...project, image: undefined });
		expect(new Uint8Array(await back.image.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
	});

	test("refuses files that aren't projects", async () => {
		await expect(fromFile("not json")).rejects.toThrow("isn't a pixelimage project");
		await expect(fromFile(JSON.stringify({ format: "pixelimage" }))).rejects.toThrow();
		const text = JSON.parse(await toFile(project));
		await expect(fromFile(JSON.stringify({ ...text, palette: { colors: ["red"] } }))).rejects.toThrow();
	});
});
