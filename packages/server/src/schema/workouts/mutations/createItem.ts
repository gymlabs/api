import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { WorkoutPlanItem } from "../types";

builder.mutationField("createWorkoutPlanItem", (t) =>
  t.fieldWithInput({
    type: WorkoutPlanItem,
    input: {
      workoutPlanId: t.input.string(),
      exerciseId: t.input.string(),
      repititions: t.input.intList(),
      weights: t.input.intList(),
      index: t.input.int(),
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
        const workoutExists = await db.workoutPlan.findUnique({
          where: {
            id: input.workoutPlanId,
          },
        });

        if (!workoutExists) {
          throw new InvalidArgumentError("Workout not found");
        }

        const exerciseExists = await db.exercise.findUnique({
          where: {
            id: input.exerciseId,
          },
        });

        if (!exerciseExists) {
          throw new InvalidArgumentError("Exercise not found");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workoutExists.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.workoutPlanItem.create({
          data: { ...input, workoutPlanId: input.workoutPlanId },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          workoutPlanId: z.string().uuid(),
          exerciseId: z.string().uuid(),
          index: z.number().min(0, "Index must be provided"),
          repititions: z
            .array(z.number())
            .min(0, "Repititions must be provided"),
          weights: z.array(z.number()).min(0, "Weights must be provided"),
        }),
        input
      );
    },
  })
);
