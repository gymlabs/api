import { ZodError, z } from "zod";

import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Post } from "../types";

builder.mutationField("createPost", (t) =>
  t.fieldWithInput({
    type: Post,
    input: {
      title: t.input.string(),
      content: t.input.string(),
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

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "POST",
            "create",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await ctx.prisma.post.create({
          data: {
            title: input.title,
            content: input.content,
            author: {
              connect: {
                id: ctx.viewer.user?.id,
              },
            },
            gym: {
              connect: {
                id: input.gymId,
              },
            },
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          title: z.string().min(1, "Title must be provided"),
          content: z.string().min(1, "Content must be provided"),
          gymId: z.string().uuid("Gym ID must be a valid UUID"),
        }),
        input,
      );
    },
  }),
);
