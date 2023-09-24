import { builder } from "../builder";

export const OrganizationWhereAdmin = builder.simpleObject(
  "OrganizationWhereAdmin",
  {
    fields: (t) => ({
      id: t.id(),
      name: t.string(),
    }),
  },
);
