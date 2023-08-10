import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  UnauthenticatedError,
  InvalidArgumentError,
  InternalServerError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Employment } from "../types";

builder.mutationField("createEmployment", (t) =>
  t.fieldWithInput({
    type: Employment,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
      roleId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        UnauthenticatedError,
        InvalidArgumentError,
        InternalServerError,
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
            "create",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.employment.create({
          data: {
            gymId: input.gymId,
            userId: input.userId,
            roleId: input.roleId,
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        });
      };

      const employment = await validationWrapper(
        wrapped,
        z.object({
          userId: z.string().uuid(),
          gymId: z.string().uuid(),
          roleId: z.string().uuid(),
        }),
        input,
      );

      return {
        ...employment,
        roleName: employment.role.name,
      };
    },
  }),
);
