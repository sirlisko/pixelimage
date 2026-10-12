/** One button per palette colour; the chosen one is marked pressed. */
export const renderSwatches = (root: HTMLElement, colors: string[], chosen: number, pick: (index: number) => void) => {
	root.replaceChildren(
		...colors.map((color, i) => {
			const button = Object.assign(document.createElement("button"), {
				type: "button",
				className: "swatch",
				title: color,
			});
			button.style.background = color;
			button.setAttribute("aria-label", color);
			button.setAttribute("aria-pressed", String(i === chosen));
			button.addEventListener("click", () => pick(i));
			return button;
		}),
	);
};
