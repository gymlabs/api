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
import { Exercise } from "../types";

builder.mutationField("createExercise", (t) =>
  t.fieldWithInput({
    type: Exercise,
    input: {
      organizationId: t.input.string(),
      name: t.input.string(),
      description: t.input.string(),
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
        if (
          !(await authenticateOrganizationEntity(
            "EXERCISE",
            "create",
            ctx.viewer.user?.id ?? "",
            input.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.exercise.create({
          data: {
            ...input,
            createdAt: new Date(),
          },
          include: {
            steps: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          name: z.string().min(1, "Name must be provided"),
          description: z.string().min(1, "Description must be provided"),
          organizationId: z.string().uuid(),
        }),
        input,
      );
    },
  }),
);
