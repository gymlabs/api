import { builder } from "../builder";

export const Post = builder.prismaObject("Post", {
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    content: t.exposeString("content"),
    author: t.relation("author"),
    gym: t.relation("gym"),
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
