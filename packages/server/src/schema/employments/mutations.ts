import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";
import { ZodError, z } from "zod";

import { Employment } from "./types";
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
  createEmployment: t.fieldWithInput({
    type: Employment,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
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
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.employment.create({
          data: {
            gymId: input.gymId,
            userId: input.userId,
            roleId: input.roleId,
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
          gymId: z.string().uuid(),
          roleId: z.string().uuid(),
        }),
        input
      );

      return {
        ...employment,
        roleName: employment.role.name,
      };
    },
  }),

  activateEmployment: t.fieldWithInput({
    type: "Boolean",
    input: {
      employmentId: t.input.string(),
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
        try {
          await db.employment.update({
            where: {
              id: input.employmentId,
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
            throw new NotFoundError("Employment not found");
          } else {
            throw new InternalServerError();
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({ employmentId: z.string().uuid() }),
        input
      );
    },
  }),

  deleteEmployment: t.fieldWithInput({
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
            "EMPLOYMENT",
            "delete",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        try {
          await db.employment.update({
            where: {
              userId_gymId: {
                userId: input.userId,
                gymId: input.gymId,
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
            throw new NotFoundError("Employment not found");
          } else {
            throw new InternalServerError();
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          userId: z.string().uuid(),
          gymId: z.string().uuid(),
        }),
        input
      );
    },
  }),
}));
