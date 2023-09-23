import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { builder } from "../../builder";
import { Role } from "../types";

builder.queryField("roleByGym", (t) =>
  t.fieldWithInput({
    type: Role,
    input: {
      gymId: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const role = await db.employment.findUnique({
          where: {
            userId_gymId: {
              gymId: input.gymId,
              userId: ctx.viewer.user?.id ?? "",
            },
          },
          select: {
            role: {
              include: {
                accessRights: true,
              },
            },
          },
        });

        if (!role) {
          throw new NotFoundError("Role");
        }

        return role.role;
      };

      return await validationWrapper(
        wrapped,
        z.object({ gymId: z.string().uuid() }),
        input,
      );
    },
  }),
);
