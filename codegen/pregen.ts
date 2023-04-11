import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";

import { schema } from "../src/schema";

const config: CodegenConfig = {
  schema: printSchema(schema),
  require: ["ts-node/register", "tsconfig-paths/register"],
  generates: {
    "./codegen/gql/schema.graphql": {
      plugins: ["schema-ast"],
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
