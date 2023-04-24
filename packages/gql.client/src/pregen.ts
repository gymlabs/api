import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";

// TODO: fix this import 🤮
import { schema } from "../../server/src/schema";

const config: CodegenConfig = {
  schema: printSchema(schema),
  generates: {
    "src/gql/schema.graphql": {
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
