import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { builder } from "../../builder";
import { GymWhereEmployed } from "../types";

// TODO: move this into the gyms query and check permissions accordingly
builder.queryField("gymsWhereEmployed", (t) =>
  t.field({
    type: [GymWhereEmployed],
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, args, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const employments = await db.employment.findMany({
        where: {
          userId: ctx.viewer.user.id,
        },
        select: {
          gym: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
          role: {
            include: {
              accessRights: true,
            },
          },
        },
      });

      return employments.map((employment) => {
        return {
          ...employment.gym,
        };
      });
    },
  }),
);
