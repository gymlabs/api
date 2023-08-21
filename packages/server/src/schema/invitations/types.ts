import { builder } from "../builder";

export const Invitation = builder.prismaObject("Invitation", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    type: t.exposeString("type"),
    status: t.exposeString("status"),
    createdAt: t.expose("createdAt", {
      type: "Date",
    }),
    updatedAt: t.expose("updatedAt", {
      type: "Date",
    }),
  }),
});
