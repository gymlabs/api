import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Workout } from "../types";

builder.mutationField("createWorkout", (t) =>
  t.fieldWithInput({
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
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const organization = await db.organization.findUnique({
          where: {
            id: input.organizationId,
          },
        });

        if (!organization) {
          throw new InvalidArgumentError("Organization not found.");
        }

        if (
          !(await authenticateOrganizationEntity(
            "WORKOUT",
            "create",
            ctx.viewer.user?.id ?? "",
            organization.id
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.workoutPlan.create({
          data: {
            organization: {
              connect: {
                id: organization.id,
              },
            },
            name: input.name,
            description: input.description,
          },
          include: {
            items: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          organizationId: z.string().uuid(),
          name: z.string().min(4, "Name must be provided"),
          description: z.string().min(1, "Description must be provided"),
        }),
        input
      );
    },
  })
);
