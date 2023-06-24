import { builder } from "../builder";

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
