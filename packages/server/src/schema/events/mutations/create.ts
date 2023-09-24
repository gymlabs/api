import { EventType } from "@gymlabs/db";
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
import { Event } from "../types";

builder.mutationField("createEvent", (t) =>
  t.fieldWithInput({
    type: Event,
    input: {
      title: t.input.string(),
      description: t.input.string(),
      location: t.input.string(),
      type: t.input.string(),
      startDate: t.input.field({ type: "Date" }),
      endDate: t.input.field({ type: "Date" }),
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
            "EVENT",
            "create",
            ctx.viewer.user?.id ?? "",
            input.gymId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        await notFoundWrapper(
          () =>
            ctx.prisma.gym.findUnique({
              where: { id: input.gymId },
            }),
          "Gym",
        );

        return await ctx.prisma.event.create({
          data: {
            ...input,
            type: input.type as EventType,
            userId: ctx.viewer.user?.id ?? "",
            createdAt: new Date(),
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          gymId: z.string().uuid(),
          title: z.string().min(1, "Title must be provided"),
          description: z.string().min(1, "Description must be provided"),
          location: z.string().min(1, "Location must be provided"),
          type: z.union([
            z.literal("COURSE"),
            z.literal("MEETING"),
            z.literal("TRAINING"),
          ]),
          startDate: z.date(),
          endDate: z.date(),
        }),
        input,
      );
    },
  }),
);
