import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import { Contract__Output } from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Contract } from "./types";
import { meta } from "../../lib/metadata";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";

builder.mutationFields((t) => ({
  createContract: t.fieldWithInput({
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
      try {
        const contract: Contract__Output = await new Promise(
          (resolve, reject) => {
            client.createContract(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...contract,
          createdAt: new Date(contract.createdAt),
          updatedAt: new Date(contract.updatedAt),
        };
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
    },
  }),
}));
