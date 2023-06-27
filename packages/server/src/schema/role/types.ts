import { builder } from "../builder";

export const Category = builder.enumType("Category", {
  values: [
    "MEMBERSHIP",
    "EMPLOYMENT",
    "WORKOUT",
    "EXERCISE",
    "USER",
    "ROLE",
    "GYM",
  ] as const,
});

export const AccessRight = builder.simpleObject("AccessRight", {
  fields: (t) => ({
    id: t.id(),
    category: t.field({ type: Category }),
    create: t.boolean(),
    read: t.boolean(),
    update: t.boolean(),
    delete: t.boolean(),
  }),
});

export const Role = builder.simpleObject("Role", {
  fields: (t) => ({
    id: t.id(),
    name: t.string(),
    accessRights: t.field({
      type: [AccessRight],
    }),
    gymId: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
