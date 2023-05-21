import { builder } from "../builder";

export const Membership = builder.simpleObject("Membership", {
  fields: (t) => ({
    id: t.id(),
    gymId: t.string(),
    userId: t.string(),
    contractId: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});

export const Memberships = builder.simpleObject("Memberships", {
  fields: (t) => ({
    memberships: t.field({
      type: [Membership],
    }),
  }),
});
