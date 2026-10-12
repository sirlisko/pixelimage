import { type Edits, line, mirrorIndex, region } from "../src/edits.ts";
import { CLEAR, type Sprite } from "../src/image.ts";

export type Tool = "pencil" | "eraser" | "fill" | "picker" | "background";

interface Hooks {
	/** The sprite as shown, edits included. */
	shown: () => Sprite | undefined;
	/** The edit set for the current crop, size and palette, changed in place. */
	edits: () => Edits;
	changed: () => void;
	picked: (index: number) => void;
	/** The background tool was used at this point, as a share (0–1) of the sprite's width and height. */
	background: (x: number, y: number) => void;
}

/** Paints on the preview canvas. Each stroke, fill or clear is one undo step. */
export const editor = (canvas: HTMLCanvasElement, hooks: Hooks) => {
	let tool: Tool = "pencil";
	let color = 0;
	let mirror = false;
	const history = new WeakMap<Edits, Edits[]>();

	const snapshot = () => {
		const edits = hooks.edits();
		const stack = history.get(edits) ?? [];
		stack.push(new Map(edits));
		history.set(edits, stack);
	};

	const pixelAt = (e: PointerEvent, sprite: Sprite) => {
		const r = canvas.getBoundingClientRect();
		const x = Math.floor(((e.clientX - r.left) / r.width) * sprite.width);
		const y = Math.floor(((e.clientY - r.top) / r.height) * sprite.height);
		return x >= 0 && y >= 0 && x < sprite.width && y < sprite.height ? { x, y } : undefined;
	};

	canvas.addEventListener("pointerdown", (e) => {
		const sprite = hooks.shown();
		const at = sprite && e.button === 0 && pixelAt(e, sprite);
		if (!sprite || !at) return;
		e.preventDefault();
		const start = at.y * sprite.width + at.x;
		if (tool === "background") {
			hooks.background((at.x + 0.5) / sprite.width, (at.y + 0.5) / sprite.height);
			return;
		}
		if (tool === "picker") {
			if (sprite.pixels[start] !== CLEAR) hooks.picked(sprite.pixels[start]);
			return;
		}
		snapshot();
		const edits = hooks.edits();
		const ink = tool === "eraser" ? CLEAR : color;
		const put = (i: number) => {
			edits.set(i, ink);
			if (mirror) edits.set(mirrorIndex(i, sprite.width), ink);
		};
		if (tool === "fill") {
			// Both regions are found before painting, so filling one can't change what the other covers.
			const regions = [region(sprite, start), mirror ? region(sprite, mirrorIndex(start, sprite.width)) : []];
			for (const i of regions.flat()) edits.set(i, ink);
			hooks.changed();
			return;
		}
		put(start);
		hooks.changed();
		canvas.setPointerCapture(e.pointerId);
		let last = at;
		const drag = (m: PointerEvent) => {
			const to = pixelAt(m, sprite);
			if (!to) return;
			for (const [x, y] of line(last.x, last.y, to.x, to.y)) put(y * sprite.width + x);
			last = to;
			hooks.changed();
		};
		const stop = () => {
			canvas.removeEventListener("pointermove", drag);
			canvas.removeEventListener("pointerup", stop);
			canvas.removeEventListener("pointercancel", stop);
		};
		canvas.addEventListener("pointermove", drag);
		canvas.addEventListener("pointerup", stop);
		canvas.addEventListener("pointercancel", stop);
	});

	return {
		setTool(next: Tool) {
			tool = next;
			canvas.dataset.tool = next;
		},
		setColor(index: number) {
			color = index;
		},
		setMirror(on: boolean) {
			mirror = on;
		},
		undo() {
			const edits = hooks.edits();
			const previous = history.get(edits)?.pop();
			if (!previous) return;
			edits.clear();
			for (const [i, index] of previous) edits.set(i, index);
			hooks.changed();
		},
		clear() {
			if (!hooks.edits().size) return;
			snapshot();
			hooks.edits().clear();
			hooks.changed();
		},
	};
};
