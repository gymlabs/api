import { ZodError, z } from "zod";

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
import { Post } from "../types";

builder.queryField("post", (t) =>
  t.fieldWithInput({
    type: Post,
    input: {
      postId: t.input.string(),
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
        const postToBeRead = await ctx.prisma.post.findUnique({
          where: {
            id: input.postId,
          },
        });

        if (
          !(await authenticateGymEntity(
            "POST",
            "read",
            ctx.viewer.user?.id ?? "",
            postToBeRead?.gymId ?? "",
          ))
        ) {
          throw new UnauthorizedError();
        }

        const post = await ctx.prisma.post.findUnique({
          where: {
            id: input.postId,
          },
        });

        if (!post) {
          throw new NotFoundError("Post");
        }

        return post;
      };

      const validatedInput = await validationWrapper(
        wrapped,
        z.object({
          postId: z.string().uuid("Post ID must be a valid UUID."),
          gymId: z.string().uuid("Gym ID must be a valid UUID."),
        }),
        input,
      );

      return validatedInput;
    },
  }),
);
