import { expect, test } from "vitest";
import { toGpl } from "../src/gpl.ts";

test("writes a GIMP palette", () => {
	expect(toGpl("Two", ["#3e2731", "#ffffff"])).toBe(
		"GIMP Palette\nName: Two\nColumns: 2\n#\n 62  39  49\t3e2731\n255 255 255\tffffff\n",
	);
});
