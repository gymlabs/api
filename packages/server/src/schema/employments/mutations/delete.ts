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

builder.mutationField("deleteEmployment", (t) =>
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
            "EMPLOYMENT",
            "delete",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        try {
          await db.employment.update({
            where: {
              userId_gymId: {
                userId: input.userId,
                gymId: input.gymId,
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
            throw new NotFoundError("Employment not found");
          } else {
            throw new InternalServerError();
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          userId: z.string().uuid(),
          gymId: z.string().uuid(),
        }),
        input
      );
    },
  })
);
