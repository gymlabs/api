import { db } from "../../../db";
import { InternalServerError, UnauthenticatedError } from "../../../errors";
import { builder } from "../../builder";
import { OrganizationWhereAdmin } from "../types";

// TODO: move this into the gyms query and check permissions accordingly
builder.queryField("organizationsWhereAdmin", (t) =>
  t.field({
    type: [OrganizationWhereAdmin],
    errors: {
      types: [InternalServerError, UnauthenticatedError],
    },
    resolve: async (query, args, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      try {
        const employments = await db.employment.findMany({
          where: {
            userId: ctx.viewer.user.id,
          },
          select: {
            gym: {
              select: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            role: {
              include: {
                accessRights: true,
              },
            },
          },
        });

        // filter by organizations where user has admin rights
        const adminEmployments = employments.filter(
          (employment) =>
            employment.role.accessRights.filter(
              (e) =>
                e.category === "ORGANIZATION" &&
                e.create &&
                e.read &&
                e.update &&
                e.delete,
            ).length > 0,
        );

        // filter out duplicate organizations
        const unique = [
          ...new Map(
            adminEmployments.map((item) => [item.gym.organization.id, item]),
          ).values(),
        ];

        return unique.map((employment) => {
          return {
            id: employment.gym.organization.id,
            name: employment.gym.organization.name,
          };
        });
      } catch (e) {
        throw new InternalServerError();
      }
    },
  }),
);
