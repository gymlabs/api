import { ZodError, z } from "zod";

import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";

builder.mutationField("deleteEvent", (t) =>
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

      const eventToDelete = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      });

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "EVENT",
            "delete",
            ctx.viewer.user?.id ?? "",
            eventToDelete?.gymId ?? "",
          ))
        ) {
          throw new UnauthorizedError();
        }

        await notFoundWrapper(
          () =>
            ctx.prisma.event.delete({
              where: { id: input.id },
            }),
          "Event",
        );

        return true;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input,
      );
    },
  }),
);
