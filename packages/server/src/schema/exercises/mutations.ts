import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType__Output,
  ExerciseStep__Output,
  Exercise__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { builder } from "../builder";
import { Exercise, ExerciseStep } from "../exercises/types";

builder.mutationFields((t) => ({
  createExercise: t.fieldWithInput({
    type: Exercise,
    input: {
      organizationId: t.input.string(),
      name: t.input.string(),
      description: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exercise: Exercise__Output = await new Promise(
        (resolve, reject) => {
          client.createExercise(input, (err, res) => {
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
  updateExercise: t.fieldWithInput({
    type: Exercise,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exercise: Exercise__Output = await new Promise(
        (resolve, reject) => {
          client.updateExercise(mapNullToUndefined(input), (err, res) => {
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
  deleteExercise: t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exercise: BooleanType__Output = await new Promise(
        (resolve, reject) => {
          client.deleteExercise(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return exercise.value;
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
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exerciseStep: ExerciseStep__Output = await new Promise(
        (resolve, reject) => {
          client.createExerciseStep(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
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
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exerciseStep: ExerciseStep__Output = await new Promise(
        (resolve, reject) => {
          client.updateExerciseStep(mapNullToUndefined(input), (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
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
    },
  }),
  deleteExerciseStep: t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const exerciseStep: BooleanType__Output = await new Promise(
        (resolve, reject) => {
          client.deleteExerciseStep(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return exerciseStep.value;
    },
  }),
}));
