import { z } from "zod";

import { db } from "../../../db";
import {
  UserHasMembershipsOrEmploymentsError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { builder } from "../../builder";
import { UserNodeRef } from "../types";

builder.mutationField("updateAccount", (t) =>
  t.withAuth({ authenticated: true }).fieldWithInput({
    type: UserNodeRef,
    description: "Update the current user account.",
    input: {
      firstName: t.input.string({ required: false }),
      lastName: t.input.string({ required: false }),
    },
    errors: {
      types: [
        UserHasMembershipsOrEmploymentsError,
        InternalServerError,
        NotFoundError,
      ],
    },
    resolve: async (parent, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const nameSchema = z.string().min(2).max(24);
      const updateSchema = z
        .object({
          firstName: nameSchema.optional(),
          lastName: nameSchema.optional(),
        })
        .and(
          z.union(
            [
              z.object({ firstName: z.undefined(), lastName: nameSchema }),
              z.object({ firstName: nameSchema, lastName: z.undefined() }),
              z.object({ firstName: nameSchema, lastName: nameSchema }),
            ],
            {
              errorMap: (issue, ctx) => ({
                message: "Either first name or last name must be filled in",
              }),
            },
          ),
        );

      type UpdateType = z.infer<typeof updateSchema>;

      const wrapped = async () => {
        return await notFoundWrapper(
          () =>
            db.user.update({
              where: {
                id: ctx.viewer.user.id,
              },
              data: {
                ...(input as UpdateType),
              },
            }),
          "User",
        );
      };

      return await validationWrapper(wrapped, updateSchema, input);
    },
  }),
);
