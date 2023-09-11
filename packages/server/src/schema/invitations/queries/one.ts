import { JsonObject } from "@gymlabs/db/dist/client/runtime/library";
import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Invitation } from "../types";

builder.queryField("invitation", (t) =>
  t.fieldWithInput({
    type: Invitation,
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      try {
        const wrapped = async () => {
          const result = await db.invitation.findUnique({
            where: input,
          });
          if (!result) {
            throw new NotFoundError("Invitation");
          }

          if (
            result.type !== "USER" &&
            !(await authenticateGymEntity(
              "INVITATION",
              "read",
              ctx.viewer.user?.id ?? "",
              (JSON.parse(result.content as string) as JsonObject)
                .gymId! as string,
            ))
          ) {
            throw new UnauthorizedError();
          }

          return result;
        };

        const invitation = await validationWrapper(
          wrapped,
          z.object({
            gymId: z.string().uuid(),
          }),
          input,
        );

        return invitation;
      } catch (err) {
        throw new InternalServerError();
      }
    },
  }),
);
