import { ZodError, z } from "zod";

import { EmploymentWithUser } from "./types";
import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import validationWrapper from "../../errors/validationWrapper";
import { authenticateGymEntity } from "../../lib/authenticate";
import { builder } from "../builder";

builder.queryFields((t) => ({
  employment: t.fieldWithInput({
    type: EmploymentWithUser,
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        const employment = await db.employment.findFirst({
          where: {
            id: input.id,
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        if (!employment) {
          throw new NotFoundError("Employment");
        }

        if (
          !(await authenticateGymEntity(
            "EMPLOYMENT",
            "read",
            ctx.viewer.user?.id ?? "",
            employment.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return employment;
      };

      const employment = await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );

      return {
        ...employment,
        roleName: employment.role.name,
      };
    },
  }),

  employments: t.fieldWithInput({
    type: [EmploymentWithUser],
    input: {
      gymId: t.input.string(),
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "EMPLOYMENT",
            "create",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const gym = await db.gym.findUnique({
          where: { id: input.gymId },
        });

        if (!gym) {
          throw new NotFoundError("Gym not found");
        }

        return await db.employment.findMany({
          where: {
            gymId: input.gymId,
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      };

      const employments = await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid(),
        }),
        input
      );

      return employments.map((employment) => ({
        ...employment,
        roleName: employment.role.name,
      }));
    },
  }),
}));
