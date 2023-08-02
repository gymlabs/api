import { ZodError, z } from "zod";

import { Role } from "./types";
import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import validationWrapper from "../../errors/validationWrapper";
import { authenticateGymEntity } from "../../lib/authenticate";
import { builder } from "../builder";

builder.queryFields((t) => ({
  roles: t.fieldWithInput({
    type: [Role],
    input: {
      gymId: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }
      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "ROLE",
            "read",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.role.findMany({
          where: {
            gymId: input.gymId,
          },
          include: {
            accessRights: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({ gymId: z.string().uuid() }),
        input
      );
    },
  }),
}));
