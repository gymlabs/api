import { ZodError, z } from "zod";

import { Exercise } from "./types";
import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import validationWrapper from "../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../lib/authenticate";
import { builder } from "../builder";

builder.queryFields((t) => ({
  exercise: t.fieldWithInput({
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
            exercise.organizationId
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
        input
      );
    },
  }),

  exercises: t.fieldWithInput({
    type: [Exercise],
    input: {
      organizationId: t.input.string(),
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
        if (
          !(await authenticateOrganizationEntity(
            "EXERCISE",
            "read",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.exercise.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            steps: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({ organizationId: z.string().uuid() }),
        input
      );
    },
  }),
}));
