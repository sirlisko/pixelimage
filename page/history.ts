import type { Edits } from "../src/edits.ts";

interface Entry {
	/** The edit set this change belongs to, or none for changes that apply whatever is on screen. */
	edits?: Edits;
	undo: () => void;
}

// Snapshots are small, but a long session shouldn't keep every one forever.
const LIMIT = 500;

/** One undo history for edits and background clicks, so ⌘Z always undoes the latest thing you did. */
export const history = () => {
	const entries: Entry[] = [];
	return {
		record(entry: Entry) {
			entries.push(entry);
			if (entries.length > LIMIT) entries.shift();
		},
		/** Undoes the latest change that applies to `current`, skipping edits to sets that aren't on screen. */
		undo(current: Edits) {
			for (let i = entries.length - 1; i >= 0; i--) {
				if (entries[i].edits && entries[i].edits !== current) continue;
				entries.splice(i, 1)[0].undo();
				return;
			}
		},
		clear() {
			entries.length = 0;
		},
	};
};

export type History = ReturnType<typeof history>;
