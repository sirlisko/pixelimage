import { darkest } from "../src/outline.ts";
import { renderSwatches } from "./swatches.ts";

const PICK = "colour";

/**
 * The outline menu plus a row of swatches shown when it's set to a picked colour. Its value, as saved in projects, is
 * "" for none, "darkest", or a palette index.
 */
export const wireOutline = (select: HTMLSelectElement, swatches: HTMLElement, changed: () => void) => {
	let colors: string[] = [];
	let picked = 0;

	const draw = () => {
		swatches.hidden = select.value !== PICK;
		if (!swatches.hidden)
			renderSwatches(swatches, colors, picked, (i) => {
				picked = i;
				draw();
				changed();
			});
	};
	select.addEventListener("change", draw);

	return {
		/** "Darkest" follows the palette; a picked colour is an index, so it can't carry over to another palette. */
		setColors: (next: string[]) => {
			colors = next;
			if (select.value === PICK && picked >= colors.length) select.value = "";
			draw();
		},
		/** The palette index to outline with, if any. */
		index: () => (select.value === "darkest" ? darkest(colors) : select.value === PICK ? picked : undefined),
		value: () => (select.value === PICK ? String(picked) : select.value),
		setValue: (value: string) => {
			const index = Number(value);
			const fits = value !== "" && value !== "darkest" && index < colors.length;
			if (fits) picked = index;
			select.value = fits ? PICK : value === "darkest" ? value : "";
			draw();
		},
	};
};
