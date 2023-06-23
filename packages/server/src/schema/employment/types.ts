import { builder } from "../builder";

export const Employment = builder.simpleObject("Employment", {
  fields: (t) => ({
    id: t.id(),
    gymId: t.string(),
    userId: t.string(),
    roleId: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});

export const Memberships = builder.simpleObject("Employments", {
  fields: (t) => ({
    employments: t.field({
      type: [Employment],
    }),
  }),
});
