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
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Workout } from "../types";

builder.queryField("workoutPlans", (t) =>
  t.fieldWithInput({
    type: [Workout],
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
        const workouts = await db.workoutPlan.findMany({
          where: {
            organization: {
              id: input.organizationId,
            },
          },
          include: {
            items: true,
          },
        });

        if (!workouts) {
          throw new NotFoundError("Workout");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "read",
            ctx.viewer.user?.id ?? "",
            input.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return workouts;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          organizationId: z.string().uuid(),
        }),
        input,
      );
    },
  }),
);
