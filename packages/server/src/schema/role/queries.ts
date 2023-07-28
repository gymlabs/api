import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import { Category, Role__Output } from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../../errors";
import { meta } from "../../lib/metadata";
import { builder } from "../builder";
import { Role } from "../role/types";

builder.queryFields((t) => ({
  role: t.fieldWithInput({
    type: Role,
    input: {
      id: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const role: Role__Output = await new Promise((resolve, reject) => {
          client.getRole(input, meta(ctx.viewer), (err, res) => {
            if (err) {
              reject(err);
            } else if (res) {
              resolve(res);
            }
          });
        });

        const { accessRights, ...rest } = role;

        const roleAccessRights =
          accessRights?.accessRights.map((accessRight) => {
            const { category, ...rest } = accessRight;
            return {
              ...rest,
              category: category.toString() as keyof typeof Category,
            };
          }) || [];

        return {
          ...rest,
          accessRights: roleAccessRights,
          createdAt: new Date(role.createdAt),
          updatedAt: new Date(role.updatedAt),
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
  roles: t.fieldWithInput({
    type: [Role],
    input: {
      gymId: t.input.string(),
    },
    errors: {
      types: [
        InvalidArgumentError,
        InternalServerError,
        NotFoundError,
        UnauthenticatedError,
        UnauthorizedError,
        ZodError,
      ],
    },
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const roles: Role__Output[] = await new Promise((resolve, reject) => {
          client.getRoles(input, meta(ctx.viewer), (err, res) => {
            if (err) {
              reject(err);
            } else if (res) {
              resolve(res.roles);
            }
          });
        });

        return roles.map((role) => {
          const { accessRights, ...rest } = role;

          const roleAccessRights =
            accessRights?.accessRights.map((accessRight) => {
              const { category, ...rest } = accessRight;
              return {
                ...rest,
                category: category.toString() as keyof typeof Category,
              };
            }) || [];

          return {
            ...rest,
            accessRights: roleAccessRights,
            createdAt: new Date(role.createdAt),
            updatedAt: new Date(role.updatedAt),
          };
        });
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
