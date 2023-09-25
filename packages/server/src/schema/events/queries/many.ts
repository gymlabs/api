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

builder.queryField("events", (t) =>
  t.fieldWithInput({
    type: [Event],
    input: {
      gymId: t.input.string(),
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

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "EVENT",
            "read",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        await notFoundWrapper(
          () =>
            ctx.prisma.gym.findUnique({
              where: {
                id: input.gymId,
              },
            }),
          "Gym",
        );

        return await ctx.prisma.event.findMany({
          where: {
            gymId: input.gymId,
          },
        });
      };

      const events = await validationWrapper(
        wrapped,
        z.object({ gymId: z.string().uuid() }),
        input,
      );

      return events;
    },
  }),
);
