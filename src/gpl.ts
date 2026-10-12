import { fromHex } from "./color.ts";

/** A GIMP palette, which Aseprite, GIMP, Krita and Inkscape all import. */
export const toGpl = (name: string, colors: string[]) =>
	[
		"GIMP Palette",
		`Name: ${name}`,
		`Columns: ${Math.min(colors.length, 8)}`,
		"#",
		...colors.map((hex) => `${fromHex(hex).map((c) => String(c).padStart(3)).join(" ")}\t${hex.slice(1)}`),
		"",
	].join("\n");
