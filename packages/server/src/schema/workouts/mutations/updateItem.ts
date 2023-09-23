import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  NotFoundError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { WorkoutPlanItem } from "../types";

builder.mutationField("updateWorkoutPlanItem", (t) =>
  t.fieldWithInput({
    type: WorkoutPlanItem,
    input: {
      id: t.input.string(),
      repetitions: t.input.intList({ required: false }),
      weights: t.input.intList({ required: false }),
      index: t.input.int({ required: false }),
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
        const { index, repetitions, weights } = input;

        const workOutPlanItemExists = await db.workoutPlanItem.findUnique({
          where: {
            id: input.id,
          },
          include: {
            workoutPlan: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        if (!workOutPlanItemExists) {
          throw new NotFoundError("Workout Plan");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workOutPlanItemExists.workoutPlan.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await notFoundWrapper(
          () =>
            db.workoutPlanItem.update({
              where: {
                id: input.id,
              },
              data: mapNullToUndefined({ index, repetitions, weights }),
            }),
          "Workout Plan Item",
        );
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          index: z.number().optional(),
          repetitions: z.array(z.number()).optional(),
          weights: z.array(z.number()).optional(),
        }),
        input,
      );
    },
  }),
);
