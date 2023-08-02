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
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Workout } from "../types";

builder.mutationField("updateUpdate", (t) =>
  t.fieldWithInput({
    type: Workout,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
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
          throw new NotFoundError("Workout not found.");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workout.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { name, description } = input;

        return await db.workoutPlan.update({
          where: {
            id: input.id,
          },
          data: mapNullToUndefined({ name, description }),
          include: {
            items: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().min(1, "Workout ID must be provided"),
          name: z.string().optional(),
          description: z.string().optional(),
        }),
        input
      );
    },
  })
);
