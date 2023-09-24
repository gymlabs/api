import { builder } from "../builder";

export const Event = builder.prismaObject("Event", {
  name: "Event",
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    description: t.exposeString("description"),
    location: t.exposeString("location"),
    type: t.exposeString("type"),
    startDate: t.expose("startDate", {
      type: "Date",
    }),
    endDate: t.expose("endDate", {
      type: "Date",
    }),
    gymId: t.exposeID("gymId"),
    userId: t.exposeID("userId"),
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
