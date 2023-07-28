import { ZodError, z } from "zod";

import { Contract } from "./types";
import { db } from "../../db";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import validationWrapper from "../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../lib/authenticate";
import { builder } from "../builder";

builder.queryFields((t) => ({
  contracts: t.fieldWithInput({
    type: [Contract],
    input: {
      organizationId: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        if (
          !(await authenticateOrganizationEntity(
            "CONTRACT",
            "read",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.contract.findMany({
          where: {
            id: input.organizationId,
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({ organizationId: z.string().uuid() }),
        input
      );
    },
  }),
  myContracts: t.fieldWithInput({
    type: [Contract],
    input: {
      userId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        if (ctx.viewer.user?.id !== input.userId) {
          throw new UnauthorizedError();
        }

        const memberships = await db.membership.findMany({
          where: {
            userId: input.userId,
          },
          include: { contract: true },
        });

        return memberships.map((membership) => membership.contract);
      };

      return await validationWrapper(
        wrapped,
        z.object({ userId: z.string().uuid() }),
        input
      );
    },
  }),
}));
