import { defineConfig } from "tsup";

export default defineConfig({
  bundle: true,
  target: "es2022",
  entry: ["injection/index.ts"],
  clean: true,
  dts: false,
  platform: "browser",
  format: ["esm"],
});
