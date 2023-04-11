import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";

import { schema } from "./src/schema";

const config: CodegenConfig = {
  schema: printSchema(schema),
  //   documents: ["src/**/*.tsx"],
  require: ["ts-node/register", "tsconfig-paths/register"],
  generates: {
    "./src/gql/": {
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
