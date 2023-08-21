import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  UnauthenticatedError,
  InvalidArgumentError,
  InternalServerError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Employment } from "../types";

builder.mutationField("createEmployment", (t) =>
  t.fieldWithInput({
    type: Employment,
    input: {
      gymId: t.input.string(),
      userEmail: t.input.string({
        validate: {
          email: true,
        },
      }),
      roleId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        UnauthenticatedError,
        InvalidArgumentError,
        InternalServerError,
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
            "EMPLOYMENT",
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

        const role = await db.role.findUnique({
          where: {
            id: input.roleId,
          },
          select: {
            id: true,
          },
        });

        if (!role) {
          throw new InvalidArgumentError("Role not found.");
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

        return await db.employment.create({
          data: {
            gym: {
              connect: { id: gym.id },
            },
            user: {
              connect: { id: user.id },
            },
            role: {
              connect: { id: role.id },
            },
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        });
      };

      const employment = await validationWrapper(
        wrapped,
        z.object({
          userId: z.string().uuid(),
          userEmail: z.string().email(),
          roleId: z.string().uuid(),
        }),
        input,
      );

      return {
        ...employment,
        roleName: employment.role.name,
      };
    },
  }),
);
