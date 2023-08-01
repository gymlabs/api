import { ZodError, z } from "zod";

import { Workout } from "./types";
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
  workout: t.fieldWithInput({
    type: Workout,
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
        const workout = await db.workoutPlan.findUnique({
          where: {
            id: input.id,
          },
          include: {
            items: true,
          },
        });

        if (!workout) {
          throw new NotFoundError("Workout");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "read",
            ctx.viewer.user?.id ?? "",
            workout.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return workout;
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

  workouts: t.fieldWithInput({
    type: [Workout],
    input: {
      organizationId: t.input.string(),
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
        const workouts = await db.workoutPlan.findMany({
          where: {
            organization: {
              id: input.organizationId,
            },
          },
          include: {
            items: true,
          },
        });

        if (!workouts) {
          throw new NotFoundError("Workout");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "read",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return workouts;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          organizationId: z.string().uuid(),
        }),
        input
      );
    },
  }),
}));
