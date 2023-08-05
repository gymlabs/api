import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/gql/schema.graphql",
  documents: ["src/gql/operations/**/*.gql"],
  generates: {
    "./src/gql/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
    },
  },
  config: {
    strictScalars: true,
    scalars: {
      Date: "Date",
    },
  },
};

export default config;
