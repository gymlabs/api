import { defineConfig } from "tsup";

export default defineConfig({
  target: "es2022",
  format: ["cjs", "esm"],
  dts: true,
  loader: {
    ".proto": "copy",
  },
});
