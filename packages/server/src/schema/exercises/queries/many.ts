import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Exercise } from "../types";

builder.queryField("exercises", (t) =>
  t.fieldWithInput({
    type: [Exercise],
    input: {
      organizationId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InternalServerError,
        InvalidArgumentError,
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
            "EXERCISE",
            "read",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.exercise.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            steps: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({ organizationId: z.string().uuid() }),
        input
      );
    },
  })
);
