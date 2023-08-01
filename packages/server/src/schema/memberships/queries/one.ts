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
import { MembershipWithUser } from "../types";

builder.queryField("gym", (t) =>
  t.fieldWithInput({
    type: MembershipWithUser,
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
        const membership = await db.membership.findFirst({
          where: {
            id: input.id,
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

        if (!membership || membership.deletedAt) {
          throw new NotFoundError("Membership");
        }

        if (
          !(await authenticateGymEntity(
            "MEMBERSHIP",
            "read",
            ctx.viewer.user?.id ?? "",
            membership.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return membership;
      };

      const membership = await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );

      return {
        ...membership,
        contractName: membership.contract.name,
      };
    },
  })
);
