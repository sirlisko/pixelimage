const KEY = "pixelimage:grid";

const remembered = () => {
	try {
		return localStorage.getItem(KEY) === "on";
	} catch {
		return false;
	}
};

/** A toggleable grid over the sprite, one cell per pixel. Returns a function to resize it to the sprite. */
export const wireGrid = (button: HTMLButtonElement, overlay: HTMLElement) => {
	const set = (on: boolean) => {
		overlay.hidden = !on;
		button.setAttribute("aria-pressed", String(on));
		try {
			localStorage.setItem(KEY, on ? "on" : "off");
		} catch {
			// The grid still works for this visit.
		}
	};
	set(remembered());
	button.addEventListener("click", () => set(button.getAttribute("aria-pressed") !== "true"));
	return (width: number, height: number) => {
		overlay.style.backgroundSize = `${100 / width}% ${100 / height}%`;
	};
};
