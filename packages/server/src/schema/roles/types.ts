import { builder } from "../builder";

export const Category = builder.enumType("Category", {
  values: [
    "ORGANIZATION",
    "GYM",
    "ROLE",
    "EMPLOYMENT",
    "CONTRACT",
    "MEMBERSHIP",
    "EXERCISE",
    "WORKOUT",
    "INVITATION"
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
