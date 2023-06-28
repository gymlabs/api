import { builder } from "../builder";

export const WorkoutPlanItem = builder.simpleObject("WorkoutPlanItem", {
  fields: (t) => ({
    id: t.id(),
    workoutId: t.string(),
    index: t.int(),
    exerciseId: t.string(),
    repetitions: t.intList(),
    weights: t.intList(),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});

export const Workout = builder.simpleObject("Workout", {
  fields: (t) => ({
    id: t.id(),
    name: t.string(),
    description: t.string(),
    items: t.field({
      type: [WorkoutPlanItem],
    }),
    createdAt: t.field({ type: "Date" }),
    updatedAt: t.field({ type: "Date" }),
  }),
});
