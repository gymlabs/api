import { builder } from "../builder";
import { UserInfo } from "../users/types";

export const Membership = builder.simpleObject("Membership", {
  fields: (t) => ({
    id: t.id(),
    gymId: t.string(),
    userId: t.string(),
    contractId: t.string(),
    contractName: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});

export const MembershipWithUser = builder.simpleObject("MembershipWithUser", {
  fields: (t) => ({
    id: t.id(),
    gymId: t.string(),
    user: t.field({
      type: UserInfo,
    }),
    contractId: t.string(),
    contractName: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
