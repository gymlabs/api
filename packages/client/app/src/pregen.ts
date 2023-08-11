import type { CodegenConfig } from "@graphql-codegen/cli";
import { printSchema } from "graphql";

// TODO: fix this import 🤮
// import { schema } from "../../server/src/schema";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { schema } from "../../../server/build/schema";

const config: CodegenConfig = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
