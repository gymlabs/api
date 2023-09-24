import { ZodError, z } from "zod";

import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Post } from "../types";

builder.queryField("posts", (t) =>
  t.fieldWithInput({
    type: [Post],
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

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "POST",
            "read",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        const posts = await ctx.prisma.post.findMany({
          where: {
            gymId: input.gymId,
          },
        });

        return posts;
      };

      const validatedInput = await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid("Gym ID must be a valid UUID."),
        }),
        input,
      );

      return validatedInput;
    },
  }),
);
