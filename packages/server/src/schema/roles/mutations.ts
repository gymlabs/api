import { ZodError, z } from "zod";

import { Role } from "./types";
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
import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { builder } from "../builder";

builder.mutationFields((t) => ({
  createRole: t.fieldWithInput({
    type: Role,
    input: {
      name: t.input.string(),
      gymId: t.input.string(),
      accessRightIds: t.input.field({
        type: ["String"],
      }),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "ROLE",
            "create",
            ctx.viewer.user?.id ?? "",
            input.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { accessRightIds, ...roleData } = input;

        return await db.role.create({
          data: {
            ...roleData,
            accessRights: {
              connect: accessRightIds.map((id) => ({ id })),
            },
          },
          include: {
            accessRights: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid(),
          name: z.string().min(4, "Name must be provided"),
          accessRightIds: z.array(z.string().uuid()),
        }),
        input
      );
    },
  }),

  updateRole: t.fieldWithInput({
    type: Role,
    input: {
      id: t.input.string(),
      name: t.input.string(),
      accessRightIds: t.input.field({
        type: ["String"],
      }),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const role = await db.role.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!role) {
          throw new NotFoundError("Role");
        }

        // Check permissions
        if (
          !(await authenticateGymEntity(
            "ROLE",
            "update",
            ctx.viewer.user?.id ?? "",
            role.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { id, name, accessRightIds } = input;

        return await db.role.update({
          where: {
            id,
          },
          data: mapNullToUndefined({
            name,
            accessRights: {
              set: accessRightIds.map((id) => ({ id })),
            },
          }),
          include: {
            accessRights: true,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          name: z.string().min(4, "Name must be provided").optional(),
          accessRightIds: z.array(z.string().uuid()),
        }),
        input
      );
    },
  }),

  deleteRole: t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const role = await db.role.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!role) {
          throw new NotFoundError("Role");
        }

        if (
          !(await authenticateGymEntity(
            "ROLE",
            "delete",
            ctx.viewer.user?.id ?? "",
            role.gymId
          ))
        ) {
          throw new UnauthorizedError();
        }

        await db.role.delete({
          where: {
            id: input.id,
          },
        });

        return true;
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
}));
