import { loadedPalettes, loadPalette, PALETTES, type Palette, paletteOf, slugOf } from "./palettes.ts";

// Not a valid slug, so it can't clash with a real palette.
const OTHER = "*lospec";

export const renderOptions = (select: HTMLSelectElement, current: string) => {
	const option = ([slug, { name, colors }]: [string, Palette]) => new Option(`${name} (${colors.length})`, slug);
	select.replaceChildren(
		...Object.entries(PALETTES).map(option),
		...loadedPalettes().map(option),
		new Option("Other Lospec palette…", OTHER),
	);
	select.value = paletteOf(current) ? current : Object.keys(PALETTES)[0];
};

/** Wires the select and its Lospec name field; `pick` gets a slug once its palette is ready. */
export const wirePicker = (select: HTMLSelectElement, field: HTMLElement, input: HTMLInputElement, pick: (slug: string) => void) => {
	select.addEventListener("change", () => {
		field.hidden = select.value !== OTHER;
		if (field.hidden) pick(select.value);
		else input.focus();
	});
	input.addEventListener("input", () => input.setCustomValidity(""));
	input.addEventListener("change", async () => {
		try {
			const slug = slugOf(input.value);
			await loadPalette(slug);
			field.hidden = true;
			input.value = "";
			renderOptions(select, slug);
			pick(slug);
		} catch (e) {
			input.setCustomValidity((e as Error).message);
			input.reportValidity();
		}
	});
};
