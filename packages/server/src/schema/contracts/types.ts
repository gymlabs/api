import { builder } from "../builder";

export const Contract = builder.simpleObject("Contract", {
  fields: (t) => ({
    id: t.id(),
    name: t.string(),
    description: t.string(),
    monthlyCost: t.float(),
    contractDuration: t.int(),
    organizationId: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
