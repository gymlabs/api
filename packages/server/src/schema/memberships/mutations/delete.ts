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
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";

builder.mutationField("deleteMembership", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
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
        if (
          !(await authenticateGymEntity(
            "MEMBERSHIP",
            "delete",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        try {
          await db.membership.update({
            where: {
              userId_gymId: {
                gymId: input.gymId,
                userId: input.userId,
              },
            },
            data: {
              deletedAt: new Date(),
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
          gymId: z.string().uuid(),
          userId: z.string().uuid(),
        }),
        input
      );
    },
  })
);
