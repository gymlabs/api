import { builder } from "../builder";
import { Role } from "../roles/types";

export const Gym = builder.simpleObject("Gym", {
  fields: (t) => ({
    id: t.id(),
    name: t.string(),
    description: t.string(),
    street: t.string(),
    city: t.string(),
    postalCode: t.string(),
    country: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});

export const GymWhereEmployed = builder.simpleObject("GymWhereEmployed", {
  fields: (t) => ({
    id: t.id(),
    name: t.string(),
    organizationId: t.string(),
    role: t.field({ type: Role }),
  }),
});
