import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "vite-plus";
import { fileURLToPath } from "node:url";

const tsconfig = fileURLToPath(new URL("./tsconfig.json", import.meta.url));
const isTest = process.env["VITEST"] === "true";

export default defineConfig({
  plugins: isTest ? [] : [angular({ tsconfig })],
  pack: { exports: true, dts: true },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {},
});
