import { expect, test } from "vitest";
import type { Edits } from "../src/edits.ts";
import { history } from "../page/history.ts";

test("undoes the latest change on screen, skipping edits to other sets", () => {
	const past = history();
	const done: string[] = [];
	const here: Edits = new Map();
	const elsewhere: Edits = new Map();
	past.record({ edits: here, undo: () => done.push("stroke") });
	past.record({ undo: () => done.push("background") });
	past.record({ edits: elsewhere, undo: () => done.push("hidden stroke") });

	past.undo(here);
	past.undo(here);
	past.undo(here);

	expect(done).toEqual(["background", "stroke"]);
	past.undo(elsewhere);
	expect(done).toEqual(["background", "stroke", "hidden stroke"]);
});
