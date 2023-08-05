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
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Gym } from "../types";

builder.queryField("gym", (t) =>
  t.fieldWithInput({
    type: Gym,
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
        if (
          !(await authenticateOrganizationEntity(
            "GYM",
            "read",
            ctx.viewer.user?.id ?? "",
            input.id
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.gym.findUnique({
          where: input,
        });
      };

      const gym = await validationWrapper(
        wrapped,
        z.object({ id: z.string().uuid() }),
        input
      );

      if (!gym) {
        throw new NotFoundError("Gym");
      }

      return {
        ...gym,
      };
    },
  })
);