import { ZodError, z } from "zod";

import { Workout, WorkoutPlanItem } from "./types";
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
import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { builder } from "../builder";

builder.mutationFields((t) => ({
  createWorkout: t.fieldWithInput({
    type: Workout,
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
        const organization = await db.organization.findUnique({
          where: {
            id: input.organizationId,
          },
        });

        if (!organization) {
          throw new InvalidArgumentError("Organization not found.");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "create",
            ctx.viewer.user?.id ?? "",
            organization.id
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.workoutPlan.create({
          data: {
            organization: {
              connect: {
                id: organization.id,
              },
            },
            name: input.name,
            description: input.description,
          },
          include: {
            items: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          organizationId: z.string().uuid(),
          name: z.string().min(4, "Name must be provided"),
          description: z.string().min(1, "Description must be provided"),
        }),
        input
      );
    },
  }),

  updateWorkout: t.fieldWithInput({
    type: Workout,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
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
        });

        if (!workout) {
          throw new NotFoundError("Workout not found.");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workout.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { name, description } = input;

        return await db.workoutPlan.update({
          where: {
            id: input.id,
          },
          data: mapNullToUndefined({ name, description }),
          include: {
            items: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().min(1, "Workout ID must be provided"),
          name: z.string().optional(),
          description: z.string().optional(),
        }),
        input
      );
    },
  }),

  deleteWorkout: t.fieldWithInput({
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
        const workout = await db.workoutPlan.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!workout) {
          throw new NotFoundError("Workout");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "delete",
            ctx.viewer.user?.id ?? "",
            workout.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        // TODO soft-delete?
        await db.workoutPlan.delete({
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
  }),

  createWorkoutPlanItem: t.fieldWithInput({
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
  }),

  updateWorkoutPlanItem: t.fieldWithInput({
    type: WorkoutPlanItem,
    input: {
      id: t.input.string(),
      repetitions: t.input.intList({ required: false }),
      weights: t.input.intList({ required: false }),
      index: t.input.int({ required: false }),
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
        const { index, repetitions, weights } = input;

        const workOutPlanItemExists = await db.workoutPlanItem.findUnique({
          where: {
            id: input.id,
          },
          include: {
            workoutPlan: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        if (!workOutPlanItemExists) {
          throw new NotFoundError("Workout Plan");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workOutPlanItemExists.workoutPlan.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.workoutPlanItem.update({
          where: {
            id: input.id,
          },
          data: mapNullToUndefined({ index, repetitions, weights }),
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          index: z.number().optional(),
          repetitions: z.array(z.number()).optional(),
          weights: z.array(z.number()).optional(),
        }),
        input
      );
    },
  }),

  deleteWorkoutPlanItem: t.fieldWithInput({
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
        const workoutPlanItemExists = await db.workoutPlanItem.findUnique({
          where: {
            id: input.id,
          },
          include: {
            workoutPlan: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        if (!workoutPlanItemExists) {
          throw new NotFoundError("Workout Plan Item");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workoutPlanItemExists.workoutPlan.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        await db.workoutPlanItem.delete({
          where: input,
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
  }),
}));
