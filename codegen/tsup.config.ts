import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./codegen/gql/graphql.ts"],
  target: "es2022",
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  outDir: "./dist",
  minify: true,
  bundle: true,
});
