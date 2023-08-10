import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  NotFoundError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Workout } from "../types";

builder.queryField("workoutPlan", (t) =>
  t.fieldWithInput({
    type: Workout,
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
        const workout = await db.workoutPlan.findUnique({
          where: {
            id: input.id,
          },
          include: {
            items: true,
          },
        });

        if (!workout) {
          throw new NotFoundError("Workout");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "read",
            ctx.viewer.user?.id ?? "",
            workout.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return workout;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );
    },
  })
);
