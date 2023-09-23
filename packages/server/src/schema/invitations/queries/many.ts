import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Invitation } from "../types";

import { db } from "../../../db";
import { ZodError, z } from "zod";
import { JsonObject } from "@gymlabs/db/dist/client/runtime/library";

builder.queryField("invitations", (t) =>
  t.fieldWithInput({
    type: [Invitation],
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      try {
        const wrapped = async () => {
          if (
            !(await authenticateGymEntity(
              "INVITATION",
              "read",
              ctx.viewer.user?.id ?? "",
              input.gymId,
            ))
          ) {
            throw new UnauthorizedError();
          }

          const result = await db.invitation.findMany({
            where: {
              type: {
                in: ["EMPLOYMENT", "MEMBERSHIP"],
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          });

          return result.filter(
            (invitation) =>
              (invitation.content! as JsonObject).gymId === input.gymId,
          );
        };

        const invitations = await validationWrapper(
          wrapped,
          z.object({
            gymId: z.string().uuid(),
          }),
          input,
        );

        return invitations;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
