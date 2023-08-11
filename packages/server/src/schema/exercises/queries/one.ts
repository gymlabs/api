import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  NotFoundError,
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Exercise } from "../types";

builder.queryField("exercise", (t) =>
  t.fieldWithInput({
    type: Exercise,
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        NotFoundError,
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
            id: input.id,
          },
          include: {
            steps: true,
          },
        });

        if (!exercise) {
          throw new NotFoundError("Exercise");
        }

        if (
          !(await authenticateOrganizationEntity(
            "EXERCISE",
            "read",
            ctx.viewer.user?.id ?? "",
            exercise.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return exercise;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input,
      );
    },
  }),
);
