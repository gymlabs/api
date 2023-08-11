import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  UnauthenticatedError,
  InvalidArgumentError,
  InternalServerError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { mapNullToUndefined } from "../../../lib/mapNullToUndefined";
import { builder } from "../../builder";
import { Contract } from "../types";

builder.mutationField("updateContract", (t) =>
  t.fieldWithInput({
    type: Contract,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
      monthlyCost: t.input.float({ required: false }),
      contractDuration: t.input.int({ required: false }),
    },
    errors: {
      types: [
        ZodError,
        UnauthenticatedError,
        InvalidArgumentError,
        InternalServerError,
        UnauthorizedError,
        NotFoundError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        const contract = await db.contract.findUnique({
          where: {
            id: input.id,
          },
        });
        if (!contract) {
          throw new NotFoundError("Contract not found.");
        }

        if (
          !(await authenticateOrganizationEntity(
            "CONTRACT",
            "update",
            ctx.viewer.user?.id ?? "",
            contract.organizationId,
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.contract.update({
          where: {
            id: input.id,
          },
          data: {
            ...mapNullToUndefined(input),
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          id: z.string().min(1, "Id must be provided"),
        }),
        input,
      );
    },
  }),
);
