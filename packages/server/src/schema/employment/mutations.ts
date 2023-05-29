import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType__Output,
  Employment__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Employment } from "./types";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";

builder.mutationFields((t) => ({
  createEmployment: t.fieldWithInput({
    type: Employment,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
      role: t.input.string(),
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const employment: Employment__Output = await new Promise(
          (resolve, reject) => {
            client.createEmployment(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return {
          ...employment,
          createdAt: new Date(employment.createdAt),
          updatedAt: new Date(employment.updatedAt),
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

  activateEmployment: t.fieldWithInput({
    type: "Boolean",
    input: {
      employmentId: t.input.string(),
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const success: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            client.activateEmployment(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return success.value;
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
    },
  }),

  deleteEmployment: t.fieldWithInput({
    type: "Boolean",
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const success: BooleanType__Output = await new Promise(
          (resolve, reject) => {
            client.deleteEmployment(input, (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );
        return success.value;
      } catch (err) {
        const error = err as grpc.ServiceError;
        switch (error.code) {
          case grpc.status.INVALID_ARGUMENT:
            throw new InvalidArgumentError(error.message);
          case grpc.status.NOT_FOUND:
            throw new NotFoundError(error.message);
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
    },
  }),
}));
