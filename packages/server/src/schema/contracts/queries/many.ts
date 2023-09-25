import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Contract } from "../types";

builder.queryField("contracts", (t) =>
  t.fieldWithInput({
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
        const canReadContracts = await authenticateOrganizationEntity(
          "CONTRACT",
          "read",
          ctx.viewer.user?.id ?? "",
          input.organizationId,
        );

        const canCreateMemberships = await authenticateOrganizationEntity(
          "MEMBERSHIP_INVITATION",
          "create",
          ctx.viewer.user?.id ?? "",
          input.organizationId,
        );

        if (canReadContracts || canCreateMemberships) {
          return await db.contract.findMany({
            where: input,
          });
        } else {
          throw new UnauthorizedError();
        }
      };

      return await validationWrapper(
        wrapped,
        z.object({ organizationId: z.string().uuid() }),
        input,
      );
    },
  }),
);
