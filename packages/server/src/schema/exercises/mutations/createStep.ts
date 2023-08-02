import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { ExerciseStep } from "../types";

builder.mutationField("createExerciseStep", (t) =>
  t.fieldWithInput({
    type: ExerciseStep,
    input: {
      exerciseId: t.input.string(),
      index: t.input.int(),
      name: t.input.string(),
      description: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InternalServerError,
        InvalidArgumentError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const exercise = await db.exercise.findUnique({
          where: {
            id: input.exerciseId,
          },
        });

        if (!exercise) {
          throw new InvalidArgumentError("Exercise does not exist");
        }

        if (
          !(await authenticateOrganizationEntity(
            "EXERCISE",
            "update",
            ctx.viewer.user?.id ?? "",
            exercise.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.exerciseStep.create({
          data: {
            ...input,
            createdAt: new Date(),
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          exerciseId: z.string().uuid(),
          name: z.string().min(1, "Name must be provided"),
          description: z.string().min(1, "Description must be provided"),
          index: z.number().min(0, "Index must be provided"),
        }),
        input
      );
    },
  })
);
