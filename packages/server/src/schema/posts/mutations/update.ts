import { ZodError, z } from "zod";

import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Post } from "../types";

builder.mutationField("updatePost", (t) =>
  t.fieldWithInput({
    type: Post,
    input: {
      id: t.input.string(),
      title: t.input.string({ required: false }),
      content: t.input.string({ required: false }),
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
        const postToBeUpdated = await ctx.prisma.post.findUnique({
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
            "update",
            ctx.viewer.user?.id ?? "",
            postToBeUpdated?.gymId ?? "",
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await ctx.prisma.post.update({
          where: {
            id: input.id,
          },
          data: mapNullToUndefined({
            ...input,
          }),
        });
      };

      return await validationWrapper(
        wrapped,
        z
          .object({
            id: z.string().uuid("ID must be a valid UUID."),
            title: z.string().min(1, "Title must be provided").optional(),
            content: z.string().min(1, "Content must be provided").optional(),
          })
          .refine(
            (value) => value.title ?? value.content,
            "Either title or content must be provided",
          ),
        input,
      );
    },
  }),
);
