import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType__Output,
  WorkoutPlanItem__Output,
  Workout__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { builder } from "../builder";
import { Workout, WorkoutPlanItem } from "../workouts/types";

builder.mutationFields((t) => ({
  createWorkout: t.fieldWithInput({
    type: Workout,
    input: {
      organizationId: t.input.string(),
      name: t.input.string(),
      description: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workout: Workout__Output = await new Promise((resolve, reject) => {
        client.createWorkout(input, (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
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
    },
  }),
  updateWorkout: t.fieldWithInput({
    type: Workout,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workout: Workout__Output = await new Promise((resolve, reject) => {
        client.updateWorkout(mapNullToUndefined(input), (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
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
    },
  }),
  deleteWorkout: t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workout: BooleanType__Output = await new Promise(
        (resolve, reject) => {
          client.deleteWorkout(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return workout.value;
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
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workoutPlanItem: WorkoutPlanItem__Output = await new Promise(
        (resolve, reject) => {
          client.createWorkoutPlanItem(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return {
        ...workoutPlanItem,
        createdAt: new Date(workoutPlanItem.createdAt),
        updatedAt: new Date(workoutPlanItem.updatedAt),
      };
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
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workoutPlanItem: WorkoutPlanItem__Output = await new Promise(
        (resolve, reject) => {
          client.updateWorkoutPlanItem(
            mapNullToUndefined(input),
            (err, res) => {
              if (err || !res) {
                reject(err);
              } else {
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
    },
  }),
  deleteWorkoutPlanItem: t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workoutPlanItem: BooleanType__Output = await new Promise(
        (resolve, reject) => {
          client.deleteWorkoutPlanItem(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return workoutPlanItem.value;
    },
  }),
}));
