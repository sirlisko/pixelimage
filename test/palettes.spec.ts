import { afterEach, describe, expect, test, vi } from "vitest";
import { loadPalette, paletteOf, slugOf } from "../page/palettes.ts";

const lospec = (body: unknown, status = 200) =>
	vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

test("slugOf accepts a name or a Lospec link", () => {
	expect(slugOf("Sweetie-16")).toBe("sweetie-16");
	expect(slugOf("https://lospec.com/palette-list/sweetie-16/")).toBe("sweetie-16");
	expect(slugOf("https://lospec.com/palette-list/sweetie-16.json")).toBe("sweetie-16");
});

describe("loadPalette", () => {
	test("loads a palette and remembers it", async () => {
		const fetch = lospec({ name: "Tiny", colors: ["FF0000", "00ff00"] });

		expect(await loadPalette("tiny")).toEqual({ name: "Tiny", colors: ["#ff0000", "#00ff00"] });
		expect(paletteOf("tiny")?.colors).toEqual(["#ff0000", "#00ff00"]);
		await loadPalette("tiny");
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	test("refuses palettes too big to show as swatches", async () => {
		lospec({ name: "Big", colors: Array.from({ length: 300 }, () => "000000") });

		await expect(loadPalette("big")).rejects.toThrow("Big has 300 colours");
	});

	test("refuses names Lospec doesn't know, without keeping them", async () => {
		lospec({}, 404);

		await expect(loadPalette("nope")).rejects.toThrow("no palette");
		expect(paletteOf("nope")).toBeUndefined();
	});

	test("refuses anything that isn't a slug before fetching", async () => {
		const fetch = lospec({});

		await expect(loadPalette("a~b")).rejects.toThrow();
		expect(fetch).not.toHaveBeenCalled();
	});
});
