import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  Exercise__Output,
  Exercises__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Exercise, Exercises } from "./types";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";

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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exercise: Exercise__Output = await new Promise(
          (resolve, reject) => {
            client.getExercise({ id: input.id }, (err, res) => {
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
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
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
  exercises: t.fieldWithInput({
    type: Exercises,
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const exercises: Exercises__Output = await new Promise(
          (resolve, reject) => {
            client.getExercises(
              { organizationId: input.organizationId },
              (err, res) => {
                if (err) {
                  reject(err);
                } else if (res) {
                  resolve(res);
                }
              }
            );
          }
        );
        return {
          exercises: exercises.exercises.map((exercise) => ({
            ...exercise,
            steps: exercise.steps.map((step) => ({
              ...step,
              createdAt: new Date(step.createdAt),
              updatedAt: new Date(step.updatedAt),
            })),
            createdAt: new Date(exercise.createdAt),
            updatedAt: new Date(exercise.updatedAt),
          })),
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
}));
