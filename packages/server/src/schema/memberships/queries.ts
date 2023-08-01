import { ZodError, z } from "zod";

import { MembershipWithUser } from "./types";
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
  membership: t.fieldWithInput({
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
  }),

  memberships: t.fieldWithInput({
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
            input.gymId
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
        input
      );

      return memberships.map((membership) => ({
        ...membership,
        contractName: membership.contract.name,
      }));
    },
  }),
}));
