import { createYoga } from "graphql-yoga";

import { getContext } from "~/context";
import { logger } from "~/logger";
import { schema } from "~/schema";

export const yoga = createYoga({
  schema,
  logging: logger,
  context: getContext,
  plugins: [],
  graphiql: true,
  landingPage: false,
});
