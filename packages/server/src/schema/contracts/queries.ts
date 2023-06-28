import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import { Contracts__Output } from "@gymlabs/admin.grpc.definition";
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

builder.queryFields((t) => ({
  contracts: t.fieldWithInput({
    type: [Contract],
    input: {
      organizationId: t.input.string(),
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
      try {
        const contracts: Contracts__Output = await new Promise(
          (resolve, reject) => {
            client.getContracts(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return contracts.contracts.map((contract) => ({
          ...contract,
          createdAt: new Date(contract.createdAt),
          updatedAt: new Date(contract.updatedAt),
        }));
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
        UnauthorizedError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const myContracts: Contracts__Output = await new Promise(
          (resolve, reject) => {
            client.GetMyContracts(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return myContracts.contracts.map((contract) => ({
          ...contract,
          createdAt: new Date(contract.createdAt),
          updatedAt: new Date(contract.updatedAt),
        }));
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
