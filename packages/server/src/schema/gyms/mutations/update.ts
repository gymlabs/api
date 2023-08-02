import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  NotFoundError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import {
  authenticateGymEntity,
  authenticateOrganizationEntity,
} from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Gym } from "../types";

builder.mutationField("updateGym", (t) =>
  t.fieldWithInput({
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
  })
);
