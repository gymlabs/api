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
import { Gym } from "../types";

builder.mutationField("createGym", (t) =>
  t.fieldWithInput({
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
  })
);
