import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { builder } from "../../builder";
import { Contract } from "../types";

builder.queryField("myContract", (t) =>
  t.fieldWithInput({
    type: [Contract],
    input: {
      userId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        if (ctx.viewer.user?.id !== input.userId) {
          throw new UnauthorizedError();
        }

        const memberships = await db.membership.findMany({
          where: {
            userId: input.userId,
          },
          include: { contract: true },
        });

        return memberships.map((membership) => membership.contract);
      };

      return await validationWrapper(
        wrapped,
        z.object({ userId: z.string().uuid() }),
        input
      );
    },
  })
);
