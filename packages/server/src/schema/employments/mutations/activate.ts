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

builder.mutationField("activateEmployment", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    input: {
      employmentId: t.input.string(),
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
        try {
          await db.employment.update({
            where: {
              id: input.employmentId,
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
            throw new NotFoundError("Employment not found");
          } else {
            throw new InternalServerError();
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({ employmentId: z.string().uuid() }),
        input,
      );
    },
  }),
);
