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
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Event } from "../types";

builder.mutationField("updateEvent", (t) =>
  t.fieldWithInput({
    type: Event,
    input: {
      id: t.input.string(),
      title: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
      location: t.input.string({ required: false }),
      type: t.input.string({ required: false }),
      startDate: t.input.field({ type: "Date", required: false }),
      endDate: t.input.field({ type: "Date", required: false }),
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

      const eventToUpdate = await ctx.prisma.event.findUnique({
        where: { id: input.id },
      });

      const wrapped = async () => {
        if (
          !(await authenticateGymEntity(
            "EVENT",
            "update",
            ctx.viewer.user?.id ?? "",
            eventToUpdate?.gymId ?? "",
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await notFoundWrapper(
          () =>
            ctx.prisma.event.update({
              where: { id: input.id },
              data: mapNullToUndefined({
                ...input,
                type: input.type as EventType,
                createdAt: new Date(),
              }),
            }),
          "Event",
        );
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
          title: z.string().min(1, "Title must be provided").optional(),
          description: z
            .string()
            .min(1, "Description must be provided")
            .optional(),
          location: z.string().min(1, "Location must be provided").optional(),
          type: z
            .union([
              z.literal("COURSE"),
              z.literal("MEETING"),
              z.literal("TRAINING"),
            ])
            .optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        }),
        input,
      );
    },
  }),
);
