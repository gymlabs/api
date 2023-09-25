import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { EmploymentWithUser } from "../types";

builder.queryField("employments", (t) =>
  t.fieldWithInput({
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
            input.gymId,
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
        input,
      );

      return employments.map((employment) => ({
        ...employment,
        roleName: employment.role.name,
      }));
    },
  }),
);
