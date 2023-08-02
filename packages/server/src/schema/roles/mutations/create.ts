import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Role } from "../types";

builder.mutationField("createRole", (t) =>
  t.fieldWithInput({
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
  })
);
