import { builder } from "../builder";
import { UserInfo } from "../user/types";

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

export const Employments = builder.simpleObject("Employments", {
  fields: (t) => ({
    employments: t.field({
      type: [Employment],
    }),
  }),
});

export const EmploymentWithUser = builder.simpleObject("EmploymentWithUser", {
  fields: (t) => ({
    id: t.id(),
    gymId: t.string(),
    user: t.field({
      type: UserInfo,
    }),
    roleId: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
