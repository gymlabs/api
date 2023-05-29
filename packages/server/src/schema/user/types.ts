import { builder } from "../builder";

export const UserNodeRef = builder.prismaNode("User", {
  id: { field: "id" },
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", {
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
    isEmailVerified: t.exposeBoolean("isEmailVerified", {
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
    createdAt: t.expose("createdAt", {
      type: "Date",
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
    updatedAt: t.expose("updatedAt", {
      type: "Date",
      authScopes: (parent, args, context, info) =>
        parent.id === context.viewer.user?.id,
    }),
  }),
});

export const AccessTokenResponse = builder.simpleObject("AccessTokenResponse", {
  fields: (t) => ({
    accessToken: t.string(),
    expiresAt: t.string(),
  }),
});
