import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Exercise } from "../types";

builder.mutationField("updateExercise", (t) =>
  t.fieldWithInput({
    type: Exercise,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
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
        const exercise = await db.exercise.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!exercise) {
          throw new NotFoundError("Exercise");
        }

        if (
          !(await authenticateOrganizationEntity(
            "EXERCISE",
            "update",
            ctx.viewer.user?.id ?? "",
            exercise.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { name, description } = input;
        return await db.exercise.update({
          where: {
            id: input.id,
          },
          data: mapNullToUndefined({ name, description }),
          include: {
            steps: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          name: z.string().optional(),
          description: z.string().optional(),
        }),
        input,
      );
    },
  }),
);
