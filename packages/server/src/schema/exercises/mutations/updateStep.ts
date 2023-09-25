import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { ExerciseStep } from "../types";

builder.mutationField("updateExerciseStep", (t) =>
  t.fieldWithInput({
    type: ExerciseStep,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
      index: t.input.int({ required: false }),
    },
    errors: {
      types: [
        ZodError,
        InternalServerError,
        InvalidArgumentError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const exerciseStep = await db.exerciseStep.findUnique({
          where: {
            id: input.id,
          },
          include: {
            exercise: true,
          },
        });

        if (!exerciseStep) {
          throw new NotFoundError("Exercise Step");
        }

        if (
          !(await authenticateOrganizationEntity(
            "EXERCISE",
            "update",
            ctx.viewer.user?.id ?? "",
            exerciseStep.exercise.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { name, description, index } = input;

        return await notFoundWrapper(
          () =>
            db.exerciseStep.update({
              where: {
                id: input.id,
              },
              data: mapNullToUndefined({ name, description, index }),
            }),
          "Exercise Step",
        );
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          name: z.string().optional(),
          description: z.string().optional(),
          index: z.number().optional(),
        }),
        input,
      );
    },
  }),
);
