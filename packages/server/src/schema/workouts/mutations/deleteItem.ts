import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  NotFoundError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";

builder.mutationField("deleteWorkoutPlanItem", (t) =>
  t.fieldWithInput({
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
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const workoutPlanItemExists = await db.workoutPlanItem.findUnique({
          where: {
            id: input.id,
          },
          include: {
            workoutPlan: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        if (!workoutPlanItemExists) {
          throw new NotFoundError("Workout Plan Item");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "update",
            ctx.viewer.user?.id ?? "",
            workoutPlanItemExists.workoutPlan.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        await notFoundWrapper(
          () =>
            db.workoutPlanItem.delete({
              where: input,
            }),
          "Workout Plan Item",
        );

        return true;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input,
      );
    },
  }),
);
