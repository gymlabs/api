import { ZodError, z } from "zod";

import {
  InvalidArgumentError,
  NotFoundError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import { notFoundWrapper } from "../../../errors/notFoundWrapper";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateGymEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Event } from "../types";

builder.queryField("event", (t) =>
  t.fieldWithInput({
    type: Event,
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        NotFoundError,
        InternalServerError,
        UnauthenticatedError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const eventToRead = await ctx.prisma.event.findUnique({
        where: input,
      });

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "EVENT",
            "read",
            ctx.viewer.user?.id ?? "",
            eventToRead?.gymId ?? "",
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await notFoundWrapper(
          () =>
            ctx.prisma.event.findUnique({
              where: input,
            }),
          "Event",
        );
      };

      return await validationWrapper(
        wrapped,
        z.object({ id: z.string().uuid() }),
        input,
      );
    },
  }),
);
