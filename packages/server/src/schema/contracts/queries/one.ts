import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Contract } from "../types";

builder.queryField("contract", (t) =>
  t.fieldWithInput({
    type: Contract,
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        UnauthenticatedError,
        ZodError,
        NotFoundError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) {
        throw new UnauthenticatedError();
      }

      const wrapped = async () => {
        const contract = await db.contract.findUnique({
          where: input,
        });

        if (!contract) {
          throw new NotFoundError("Contract not found.");
        }

        if (
          !(await authenticateOrganizationEntity(
            "CONTRACT",
            "read",
            ctx.viewer.user?.id ?? "",
            contract.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return contract;
      };

      return await validationWrapper(
        wrapped,
        z.object({ id: z.string().uuid() }),
        input,
      );
    },
  }),
);
