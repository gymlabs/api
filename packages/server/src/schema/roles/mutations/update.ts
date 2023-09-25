import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Role } from "../types";

builder.mutationField("updateRole", (t) =>
  t.fieldWithInput({
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
            role.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        const { id, name, accessRightIds } = input;

        return await notFoundWrapper(
          () =>
            db.role.update({
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
            }),
          "Role",
        );
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          name: z.string().min(4, "Name must be provided").optional(),
          accessRightIds: z.array(z.string().uuid()),
        }),
        input,
      );
    },
  }),
);
