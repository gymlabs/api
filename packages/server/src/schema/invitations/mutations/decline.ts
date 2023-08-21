import { PrismaClientKnownRequestError } from "@gymlabs/db/dist/client/runtime/library";
import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InternalServerError,
  InvalidCredentialsError,
  NotFoundError,
  UnauthenticatedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { builder } from "../../builder";

builder.mutationField("declineInvitation", (t) =>
  t.withAuth({ authenticated: true }).fieldWithInput({
    type: "Boolean",
    description: "Decline an invitation",
    errors: {
      types: [
        ZodError,
        InvalidCredentialsError,
        InternalServerError,
        UnauthenticatedError,
        NotFoundError,
      ],
    },
    input: {
      token: t.input.string(),
    },
    resolve: async (parent, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        try {
          await db.invitation.update({
            where: {
              token: input.token,
            },
            data: {
              status: "DECLINED",
            },
          });
          return true;
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new NotFoundError("User not found");
          } else {
            throw new InternalServerError();
          }
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({
          token: z.string(),
        }),
        input,
      );
    },
  }),
);
