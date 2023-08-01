import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";

builder.mutationField("deleteExerciseStep", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        InternalServerError,
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
            exerciseStep.exercise.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        // TODO: soft-delete and error boundary?
        await db.exerciseStep.delete({
          where: { id: input.id },
        });

        return true;
      };

      return await validationWrapper(
        wrapped,
        z.object({ id: z.string().uuid() }),
        input
      );
    },
  })
);
