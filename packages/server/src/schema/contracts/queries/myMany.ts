import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { builder } from "../../builder";
import { Contract } from "../types";

builder.queryField("myContracts", (t) =>
  t.field({
    type: [Contract],
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
      ],
    },
    resolve: async (query, args, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const memberships = await db.membership.findMany({
          where: {
            userId: ctx.viewer.user?.id,
          },
          select: {
            contract: true,
          },
        });

        return memberships.map((membership) => membership.contract);
      };

      return await validationWrapper(wrapped, z.any(), {});
    },
  }),
);
