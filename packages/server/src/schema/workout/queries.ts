import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  Workout__Output,
  Workouts__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { meta } from "../../lib/metadata";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";
import { Workout } from "../workout/types";

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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workout: Workout__Output = await new Promise(
          (resolve, reject) => {
            client.getWorkout(input, meta(args.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...workout,
          items: workout.items.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
          createdAt: new Date(workout.createdAt),
          updatedAt: new Date(workout.updatedAt),
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workouts: Workouts__Output = await new Promise(
          (resolve, reject) => {
            client.getWorkouts(input, meta(args.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return workouts.workouts.map((workout) => ({
          ...workout,
          items: workout.items.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
          createdAt: new Date(workout.createdAt),
          updatedAt: new Date(workout.updatedAt),
        }));
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
