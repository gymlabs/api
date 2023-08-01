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

builder.mutationField("deleteExercise", (t) =>
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
            "delete",
            ctx.viewer.user?.id ?? "",
            exercise.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        await db.exercise.delete({
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
