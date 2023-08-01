import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";
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
import { builder } from "../../builder";

builder.mutationField("activateMembership", (t) =>
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
        const membershipExists = await db.membership.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!membershipExists) {
          throw new NotFoundError("Membership");
        }

        try {
          await db.membership.update({
            where: {
              id: input.id,
            },
            data: {
              isActive: true,
            },
          });

          return true;
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new NotFoundError("Membership");
          } else {
            throw e;
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );
    },
  })
);
