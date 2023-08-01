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

builder.mutationField("deleteWorkout", (t) =>
  t.fieldWithInput({
    type: "Boolean",
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
        });

        if (!workout) {
          throw new NotFoundError("Workout");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "delete",
            ctx.viewer.user?.id ?? "",
            workout.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        // TODO soft-delete?
        await db.workoutPlan.delete({
          where: {
            id: input.id,
          },
        });

        return true;
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
