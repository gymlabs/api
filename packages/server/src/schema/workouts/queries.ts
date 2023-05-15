import client from "@gymlabs/admin.grpc.client";
import {
  Workout__Output,
  Workouts__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { builder } from "../builder";
import { Workout, Workouts } from "../workouts/types";

builder.queryFields((t) => ({
  workout: t.fieldWithInput({
    type: Workout,
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workout: Workout__Output = await new Promise((resolve, reject) => {
        client.getWorkout({ id: input.id }, (err, res) => {
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
  workouts: t.fieldWithInput({
    type: Workouts,
    input: {
      organizationId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const workouts: Workouts__Output = await new Promise(
        (resolve, reject) => {
          client.getWorkouts(
            { organizationId: input.organizationId },
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
        workouts: workouts.workouts.map((workout) => ({
          ...workout,
          items: workout.items.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
          createdAt: new Date(workout.createdAt),
          updatedAt: new Date(workout.updatedAt),
        })),
      };
    },
  }),
}));
