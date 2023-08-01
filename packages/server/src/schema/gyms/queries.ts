import { ZodError, z } from "zod";

import { Gym, GymWhereEmployed } from "./types";
import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import validationWrapper from "../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../lib/authenticate";
import { builder } from "../builder";

builder.queryFields((t) => ({
  gym: t.fieldWithInput({
    type: Gym,
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        NotFoundError,
        InternalServerError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        if (
          !(await authenticateOrganizationEntity(
            "GYM",
            "read",
            ctx.viewer.user?.id ?? "",
            input.id
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.gym.findUnique({
          where: input,
        });
      };

      const gym = await validationWrapper(
        wrapped,
        z.object({ id: z.string().uuid() }),
        input
      );

      if (!gym) {
        throw new NotFoundError("Gym");
      }

      return {
        id: gym.id,
        name: gym.name,
        description: gym.description,
        street: gym.street,
        city: gym.city,
        postalCode: gym.postalCode,
        country: gym.country,
        createdAt: gym.createdAt,
        updatedAt: gym.updatedAt,
      };
    },
  }),

  gyms: t.fieldWithInput({
    type: [Gym],
    input: {
      organizationId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        if (
          !(await authenticateOrganizationEntity(
            "GYM",
            "read",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.gym.findMany({
          where: {
            id: input.organizationId,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          organizationId: z.string().uuid(),
        }),
        input
      );
    },
  }),

  // TODO: move this into the gyms query and check permissions accordingly
  gymsWhereEmployed: t.field({
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
          id: ctx.viewer.user?.id,
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
          id: employment.gym.id,
          name: employment.gym.name,
          organizationId: employment.gym.organizationId,
          role: employment.role,
        };
      });
    },
  }),
}));
