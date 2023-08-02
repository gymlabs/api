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

builder.mutationField("deleteRole", (t) =>
  t.fieldWithInput({
    type: "Boolean",
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
        });

        if (!role) {
          throw new NotFoundError("Role");
        }

        if (
          !(await authenticateGymEntity(
            "ROLE",
            "delete",
            ctx.viewer.user?.id ?? "",
            role.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        await db.role.delete({
          where: {
            id: input.id,
          },
        });

        return true;
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
