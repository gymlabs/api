import { ZodError, z } from "zod";

import { Gym } from "./types";
import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import validationWrapper from "../../errors/validationWrapper";
import {
  authenticateGymEntity,
  authenticateOrganizationEntity,
} from "../../lib/authenticate";
import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { builder } from "../builder";

builder.mutationFields((t) => ({
  createGym: t.fieldWithInput({
    type: Gym,
    input: {
      name: t.input.string(),
      organizationId: t.input.string(),
      city: t.input.string(),
      country: t.input.string(),
      description: t.input.string(),
      postalCode: t.input.string(),
      street: t.input.string(),
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

      const wrapped = async () => {
        if (
          !(await authenticateOrganizationEntity(
            "GYM",
            "create",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const organization = await db.organization.findUnique({
          where: { id: input.organizationId },
        });

        if (!organization) {
          throw new InvalidArgumentError("Organization not found.");
        }

        return await db.gym.create({
          data: {
            ...input,
            createdAt: new Date(),
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          organizationId: z.string().uuid(),
          name: z.string().min(1, "Name must be provided"),
          description: z.string().min(1, "Description must be provided"),
          street: z.string().min(1, "Street must be provided"),
          city: z.string().min(1, "City must be provided"),
          postalCode: z.string().min(1, "Postal code must be provided"),
          country: z.string().min(1, "Country must be provided"),
        }),
        input
      );
    },
  }),

  updateGym: t.fieldWithInput({
    type: Gym,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      organizationId: t.input.string({ required: false }),
      city: t.input.string({ required: false }),
      country: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
      postalCode: t.input.string({ required: false }),
      street: t.input.string({ required: false }),
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

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "GYM",
            "update",
            ctx.viewer.user?.id ?? "",
            input.id
          ))
        ) {
          throw new UnauthorizedError();
        }

        const gym = await db.gym.findUnique({
          where: { id: input.id },
        });

        if (!gym) {
          throw new NotFoundError("Gym");
        }

        if (
          input.organizationId &&
          !(await authenticateOrganizationEntity(
            "GYM",
            "update",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.gym.update({
          where: { id: input.id },
          data: mapNullToUndefined({
            ...input,
          }),
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          name: z.string().optional(),
          description: z.string().optional(),
          street: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        }),
        input
      );
    },
  }),
}));
