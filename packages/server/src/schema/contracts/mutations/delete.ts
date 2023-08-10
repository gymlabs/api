import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  InvalidArgumentError,
  NotFoundError,
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";

builder.mutationField("deleteContract", (t) =>
  t.fieldWithInput({
    type: "Boolean",
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
            "delete",
            ctx.viewer.user?.id ?? "",
            contract.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        await db.contract.delete({
          where: input,
        });

        return true;
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().uuid(),
        }),
        input
      );
    },
  })
);
