import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import { Gym__Output, Gyms__Output } from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";
import { Gym, Gyms } from "../gyms/types";

builder.queryFields((t) => ({
  gyms: t.fieldWithInput({
    type: Gyms,
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const gyms: Gyms__Output = await new Promise((resolve, reject) => {
          client.getGyms(
            { organizationId: input.organizationId },
            (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            }
          );
        });
        return {
          gyms: gyms.gyms.map((gym) => ({
            ...gym,
            createdAt: new Date(gym.createdAt),
            updatedAt: new Date(gym.updatedAt),
          })),
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
  gym: t.fieldWithInput({
    type: Gym,
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
    resolve: async (query, { input }, args, context) => {
      if (!args.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const gym: Gym__Output = await new Promise((resolve, reject) => {
          client.getGym({ id: input.id }, (err, res) => {
            if (err) {
              reject(err);
            } else if (res) {
              resolve(res);
            }
          });
        });
        return {
          ...gym,
          createdAt: new Date(gym.createdAt),
          updatedAt: new Date(gym.updatedAt),
        };
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
