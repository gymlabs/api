import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Role } from "../types";

builder.queryField("role", (t) =>
  t.fieldWithInput({
    type: Role,
    input: {
      id: t.input.string(),
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
        const role = await db.role.findUnique({
          where: {
            id: input.id,
          },
          include: {
            accessRights: true,
          },
        });

        if (!role) {
          throw new NotFoundError("Role");
        }

        if (
          !(await authenticateGymEntity(
            "ROLE",
            "read",
            ctx.viewer.user?.id ?? "",
            role.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return role;
      };

      return await validationWrapper(
        wrapped,
        z.object({ id: z.string().uuid() }),
        input,
      );
    },
  }),
);
