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
            input.gymId,
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
        input,
      );

      return {
        ...membership,
        contractName: membership.contract.name,
      };
    },
  }),
);
