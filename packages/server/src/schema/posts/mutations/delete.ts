import { ZodError, z } from "zod";

import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";

builder.mutationField("deletePost", (t) =>
  t.fieldWithInput({
    type: "Boolean",
    input: {
      id: t.input.string(),
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

      const wrapped = async () => {
        const postToBeDeleted = await ctx.prisma.post.findUnique({
          where: {
            id: input.id,
          },
          select: {
            gymId: true,
          },
        });

        if (
          !(await authenticateGymEntity(
            "POST",
            "delete",
            ctx.viewer.user?.id ?? "",
            postToBeDeleted?.gymId ?? "",
          ))
        ) {
          throw new UnauthorizedError();
        }

        await notFoundWrapper(async () => {
          await ctx.prisma.post.delete({
            where: {
              id: input.id,
            },
          });
        }, "Post");

        return true;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid("ID must be a valid UUID."),
        }),
        input,
      );
    },
  }),
);
