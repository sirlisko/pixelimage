import { defineConfig } from "vite";

export default defineConfig({
	root: "page",
	base: "/",
	build: { outDir: "../site", emptyOutDir: true },
});
