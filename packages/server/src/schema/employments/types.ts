import { builder } from "../builder";
import { UserInfo } from "../users/types";

export const Employment = builder.simpleObject("Employment", {
  fields: (t) => ({
    id: t.id(),
    gymId: t.string(),
    userId: t.string(),
    roleId: t.string(),
    roleName: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
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
    roleName: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
