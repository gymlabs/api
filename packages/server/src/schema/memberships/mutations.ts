import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";
import { ZodError, z } from "zod";

import { Membership } from "./types";
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

builder.mutationFields((t) => ({
  createMembership: t.fieldWithInput({
    type: Membership,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
      contractId: t.input.string(),
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
            "create",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const gym = await db.gym.findUnique({
          where: {
            id: input.gymId,
          },
        });

        if (!gym) {
          throw new InvalidArgumentError("Gym not found.");
        }

        const contract = await db.contract.findUnique({
          where: {
            id: input.contractId,
          },
        });

        if (!contract) {
          throw new InvalidArgumentError("Contract not found.");
        }

        return await db.membership.create({
          data: {
            ...input,
            createdAt: new Date(),
          },
          include: {
            contract: {
              select: {
                name: true,
              },
            },
          },
        });
      };

      const membership = await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid(),
          userId: z.string().uuid(),
          contractId: z.string().uuid(),
        }),
        input
      );

      return {
        id: membership.id,
        gymId: membership.gymId,
        userId: membership.userId,
        contractId: membership.contractId,
        contractName: membership.contract.name,
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      };
    },
  }),

  activateMembership: t.fieldWithInput({
    type: "Boolean",
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
        const membershipExists = await db.membership.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!membershipExists) {
          throw new NotFoundError("Membership");
        }

        try {
          await db.membership.update({
            where: {
              id: input.id,
            },
            data: {
              isActive: true,
            },
          });

          return true;
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new NotFoundError("Membership");
          } else {
            throw e;
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );
    },
  }),

  deleteMembership: t.fieldWithInput({
    type: "Boolean",
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
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
          !(await authenticateGymEntity(
            "MEMBERSHIP",
            "delete",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        try {
          await db.membership.update({
            where: {
              userId_gymId: {
                gymId: input.gymId,
                userId: input.userId,
              },
            },
            data: {
              deletedAt: new Date(),
            },
          });

          return true;
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new NotFoundError("Membership");
          } else {
            throw e;
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid(),
          userId: z.string().uuid(),
        }),
        input
      );
    },
  }),
}));
