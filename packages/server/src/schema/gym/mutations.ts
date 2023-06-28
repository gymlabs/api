import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import { Gym__Output } from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Gym } from "./types";
import { mapNullToUndefined } from "../../lib/mapNullToUndefined";
import { meta } from "../../lib/metadata";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";

builder.mutationFields((t) => ({
  createGym: t.fieldWithInput({
    type: Gym,
    input: {
      name: t.input.string(),
      organizationId: t.input.string(),
      city: t.input.string(),
      country: t.input.string(),
      description: t.input.string(),
      postalCode: t.input.string(),
      street: t.input.string(),
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
        const gym: Gym__Output = await new Promise((resolve, reject) => {
          client.createGym(input, meta(ctx.viewer), (err, res) => {
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
          case grpc.status.PERMISSION_DENIED:
            throw new UnauthorizedError();
          default:
            throw new InternalServerError();
        }
      }
    },
  }),
  updateGym: t.fieldWithInput({
    type: Gym,
    input: {
      id: t.input.string(),
      name: t.input.string({ required: false }),
      organizationId: t.input.string({ required: false }),
      city: t.input.string({ required: false }),
      country: t.input.string({ required: false }),
      description: t.input.string({ required: false }),
      postalCode: t.input.string({ required: false }),
      street: t.input.string({ required: false }),
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const gym: Gym__Output = await new Promise((resolve, reject) => {
          client.updateGym(
            mapNullToUndefined(input),
            meta(ctx.viewer),
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
