import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType__Output,
  ExerciseStep__Output,
  Exercise__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";
import { Exercise, ExerciseStep } from "../exercises/types";

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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exercise: Exercise__Output = await new Promise(
          (resolve, reject) => {
            client.createExercise(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...exercise,
          steps: exercise.steps.map((step) => ({
            ...step,
            createdAt: new Date(step.createdAt),
            updatedAt: new Date(step.updatedAt),
          })),
          createdAt: new Date(exercise.createdAt),
          updatedAt: new Date(exercise.updatedAt),
        };
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exercise: Exercise__Output = await new Promise(
          (resolve, reject) => {
            client.updateExercise(mapNullToUndefined(input), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...exercise,
          steps: exercise.steps.map((step) => ({
            ...step,
            createdAt: new Date(step.createdAt),
            updatedAt: new Date(step.updatedAt),
          })),
          createdAt: new Date(exercise.createdAt),
          updatedAt: new Date(exercise.updatedAt),
        };
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exercise: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            client.deleteExercise(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return exercise.value;
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exerciseStep: ExerciseStep__Output = await new Promise(
          (resolve, reject) => {
            client.createExerciseStep(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...exerciseStep,
          createdAt: new Date(exerciseStep.createdAt),
          updatedAt: new Date(exerciseStep.updatedAt),
        };
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exerciseStep: ExerciseStep__Output = await new Promise(
          (resolve, reject) => {
            client.updateExerciseStep(mapNullToUndefined(input), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...exerciseStep,
          createdAt: new Date(exerciseStep.createdAt),
          updatedAt: new Date(exerciseStep.updatedAt),
        };
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exerciseStep: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            client.deleteExerciseStep(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return exerciseStep.value;
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
    },
  }),
}));
