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
import { Membership } from "../types";

builder.mutationField("createMembership", (t) =>
  t.fieldWithInput({
    type: Membership,
    input: {
      gymId: t.input.string(),
      userEmail: t.input.string({
        validate: {
          email: true,
        },
      }),
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
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        const gym = await db.gym.findUnique({
          where: {
            id: input.gymId,
          },
          select: {
            id: true,
          },
        });

        if (!gym) {
          throw new InvalidArgumentError("Gym not found.");
        }

        const contract = await db.contract.findUnique({
          where: {
            id: input.contractId,
          },
          select: {
            id: true,
          },
        });

        if (!contract) {
          throw new InvalidArgumentError("Contract not found.");
        }

        const user = await db.user.findUnique({
          where: {
            email: input.userEmail,
          },
          select: {
            id: true,
          },
        });

        if (!user) {
          throw new InvalidArgumentError("User does not exist");
        }

        return await db.membership.create({
          data: {
            gymId: gym.id,
            userId: user.id,
            contractId: contract.id,
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
          userEmail: z.string().email(),
          contractId: z.string().uuid(),
        }),
        input,
      );

      return {
        ...membership,
        contractName: membership.contract.name,
      };
    },
  }),
);
