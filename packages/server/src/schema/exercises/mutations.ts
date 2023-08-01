import { ZodError, z } from "zod";

import { Exercise, ExerciseStep } from "./types";
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
  createExercise: t.fieldWithInput({
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
            input.organizationId
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
        input
      );
    },
  }),

  updateExercise: t.fieldWithInput({
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
            exercise.organizationId
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
        input
      );
    },
  }),

  deleteExercise: t.fieldWithInput({
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
            /* TODO: eventuell die orga ids und gym ids in den viewer
            würde das alles etwas cleaner machen (auch an anderen Stellen)
            */
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
  }),

  createExerciseStep: t.fieldWithInput({
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
  }),

  updateExerciseStep: t.fieldWithInput({
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
            exerciseStep.exercise.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { name, description, index } = input;

        return await db.exerciseStep.update({
          where: {
            id: input.id,
          },
          data: mapNullToUndefined({ name, description, index }),
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          name: z.string().optional(),
          description: z.string().optional(),
          index: z.number().optional(),
        }),
        input
      );
    },
  }),

  deleteExerciseStep: t.fieldWithInput({
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
  }),
}));
