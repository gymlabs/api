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
import { EmploymentWithUser } from "../types";

builder.queryField("employment", (t) =>
  t.fieldWithInput({
    type: EmploymentWithUser,
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        const employment = await db.employment.findFirst({
          where: {
            id: input.id,
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        if (!employment) {
          throw new NotFoundError("Employment");
        }

        if (
          !(await authenticateGymEntity(
            "EMPLOYMENT",
            "read",
            ctx.viewer.user?.id ?? "",
            employment.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return employment;
      };

      const employment = await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );

      return {
        ...employment,
        roleName: employment.role.name,
      };
    },
  })
);
