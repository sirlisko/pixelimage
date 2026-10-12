import type { Tool, editor } from "./editor.ts";
import { renderSwatches } from "./swatches.ts";

const KEYS: Record<string, Tool> = { b: "pencil", e: "eraser", g: "fill", i: "picker", w: "background" };

/** Tool buttons, swatches and shortcuts (Aseprite's letters) for an editor. Returns a function to redraw swatches. */
export const wireTools = (root: HTMLElement, edit: ReturnType<typeof editor>) => {
	const toolButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-tool]")];
	const swatches = root.querySelector(".swatches") as HTMLElement;
	let colors: string[] = [];
	let color = 0;
	let current: Tool = "pencil";

	const useTool = (tool: Tool) => {
		current = tool;
		edit.setTool(tool);
		for (const b of toolButtons) b.setAttribute("aria-pressed", String(b.dataset.tool === tool));
	};

	const useColor = (index: number) => {
		color = index;
		edit.setColor(index);
		renderSwatches(swatches, colors, color, (i) => {
			useColor(i);
			if (current !== "fill") useTool("pencil");
		});
	};

	for (const b of toolButtons) b.addEventListener("click", () => useTool(b.dataset.tool as Tool));
	root.querySelector("#undo")?.addEventListener("click", () => edit.undo());
	root.querySelector("#clear-edits")?.addEventListener("click", () => edit.clear());

	window.addEventListener("keydown", (e) => {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
		if ((e.metaKey || e.ctrlKey) && e.key === "z") {
			e.preventDefault();
			edit.undo();
		} else if (!e.metaKey && !e.ctrlKey && !e.altKey && KEYS[e.key]) useTool(KEYS[e.key]);
	});

	return {
		setColors(next: string[]) {
			colors = next;
			useColor(Math.min(color, colors.length - 1));
		},
		/** After the picker: paint with that colour straight away. */
		picked(index: number) {
			useColor(index);
			useTool("pencil");
		},
	};
};
