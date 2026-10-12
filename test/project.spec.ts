import { expect, test } from "vitest";
import { packEdits, unpackEdits } from "../page/project.ts";

test("edits survive packing, minus empty sets", () => {
	const store = new Map([
		["a", new Map([[3, 1], [7, -1]])],
		["b", new Map<number, number>()],
	]);
	expect(unpackEdits(packEdits(store))).toEqual(new Map([["a", new Map([[3, 1], [7, -1]])]]));
});
