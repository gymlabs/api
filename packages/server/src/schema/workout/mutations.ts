import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType__Output,
  WorkoutPlanItem__Output,
  Workout__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Workout, WorkoutPlanItem } from "./types";
import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { meta } from "../../lib/metadata";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";

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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workout: Workout__Output = await new Promise(
          (resolve, reject) => {
            client.createWorkout(input, meta(ctx.viewer), (err, res) => {
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workout: Workout__Output = await new Promise(
          (resolve, reject) => {
            client.updateWorkout(
              mapNullToUndefined(input),
              meta(ctx.viewer),
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workout: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            client.deleteWorkout(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return workout.value;
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
  createWorkoutPlanItem: t.fieldWithInput({
    type: WorkoutPlanItem,
    input: {
      workoutId: t.input.string(),
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workoutPlanItem: WorkoutPlanItem__Output = await new Promise(
          (resolve, reject) => {
            client.createWorkoutPlanItem(
              input,
              meta(ctx.viewer),
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
          ...workoutPlanItem,
          createdAt: new Date(workoutPlanItem.createdAt),
          updatedAt: new Date(workoutPlanItem.updatedAt),
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
  updateWorkoutPlanItem: t.fieldWithInput({
    type: WorkoutPlanItem,
    input: {
      id: t.input.string(),
      repititions: t.input.intList({ required: false }),
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workoutPlanItem: WorkoutPlanItem__Output = await new Promise(
          (resolve, reject) => {
            client.updateWorkoutPlanItem(
              mapNullToUndefined(input),
              meta(ctx.viewer),
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
          ...workoutPlanItem,
          createdAt: new Date(workoutPlanItem.createdAt),
          updatedAt: new Date(workoutPlanItem.updatedAt),
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const workoutPlanItem: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            client.deleteWorkoutPlanItem(
              input,
              meta(ctx.viewer),
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
        return workoutPlanItem.value;
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
}));
