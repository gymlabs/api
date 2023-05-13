import client from "@gymlabs/admin.grpc.client";
import {
  Exercise__Output,
  Exercises__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { builder } from "../builder";
import { Exercise, Exercises } from "../exercises/types";

builder.queryFields((t) => ({
  exercise: t.fieldWithInput({
    type: Exercise,
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exercise: Exercise__Output = await new Promise(
        (resolve, reject) => {
          client.getExercise({ id: input.id }, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
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
    },
  }),
  exercises: t.fieldWithInput({
    type: Exercises,
    input: {
      organizationId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exercises: Exercises__Output = await new Promise(
        (resolve, reject) => {
          client.getExercises(
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
    },
  }),
}));
