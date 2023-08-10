import { builder } from "../builder";

export const ExerciseStep = builder.simpleObject("ExerciseStep", {
  fields: (t) => ({
    id: t.id(),
    exerciseId: t.string(),
    index: t.int(),
    name: t.string(),
    description: t.string(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});

export const Exercise = builder.simpleObject("Exercise", {
  fields: (t) => ({
    id: t.id(),
    name: t.string(),
    description: t.string(),
    steps: t.field({
      type: [ExerciseStep],
    }),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
