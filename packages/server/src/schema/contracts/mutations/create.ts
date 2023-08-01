import { ZodError, z } from "zod";

import { db } from "../../../db";
import {
  UnauthenticatedError,
  InvalidArgumentError,
  InternalServerError,
  UnauthorizedError,
} from "../../../errors";
import validationWrapper from "../../../errors/validationWrapper";
import { authenticateOrganizationEntity } from "../../../lib/authenticate";
import { builder } from "../../builder";
import { Contract } from "../types";

builder.mutationField("createEmployment", (t) =>
  t.fieldWithInput({
    type: Contract,
    input: {
      name: t.input.string(),
      description: t.input.string(),
      monthlyCost: t.input.float(),
      contractDuration: t.input.int(),
      organizationId: t.input.string(),
    },
    errors: {
      types: [
        ZodError,
        UnauthenticatedError,
        InvalidArgumentError,
        InternalServerError,
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();

      const wrapped = async () => {
        if (
          !(await authenticateOrganizationEntity(
            "CONTRACT",
            "create",
            ctx.viewer.user?.id ?? "",
            input.organizationId
          ))
        ) {
          throw new UnauthorizedError();
        }

        return await db.contract.create({
          data: {
            ...input,
            createdAt: new Date(),
          },
        });
      };

      return await validationWrapper(
        wrapped,
        z.object({
          name: z.string().min(1, "Name must be provided"),
          description: z.string().min(1, "Description must be provided"),
          monthlyCost: z
            .number()
            .min(0, "Monthly cost must be provided and >= 0"),
          contractDuration: z
            .number()
            .min(1, "Contract duration must be provided and > 0"),
          organizationId: z.string().uuid(),
        }),
        input
      );
    },
  })
);
