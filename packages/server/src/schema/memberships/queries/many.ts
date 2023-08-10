import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { MembershipWithUser } from "../types";

builder.queryField("memberships", (t) =>
  t.fieldWithInput({
    type: [MembershipWithUser],
    input: {
      gymId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
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
            "MEMBERSHIP",
            "read",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.membership.findMany({
          where: {
            gym: {
              id: input.gymId,
            },
          },
          include: {
            contract: {
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
      };

      const memberships = await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid(),
        }),
        input,
      );

      return memberships.map((membership) => ({
        ...membership,
        contractName: membership.contract.name,
      }));
    },
  }),
);
