import { builder } from "../builder";
import { Role } from "../roles/types";

export const Gym = builder.prismaObject("Gym", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    street: t.exposeString("street"),
    city: t.exposeString("city"),
    postalCode: t.exposeString("postalCode"),
    country: t.exposeString("country"),
    createdAt: t.expose("createdAt", {
      type: "Date",
    }),
    updatedAt: t.expose("updatedAt", {
      type: "Date",
    }),
    deletedAt: t.expose("deletedAt", {
      type: "Date",
      nullable: true,
    }),
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
