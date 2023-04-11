import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./codegen/gql/schema.graphql",
  documents: ["codegen/gql/operations/**/*.gql"],
  generates: {
    "./codegen/gql/graphql.ts": {
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
