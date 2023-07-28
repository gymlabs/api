import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  Employment__Output,
  Employments__Output,
} from "@gymlabs/admin.grpc.definition";
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
import { EmploymentWithUser } from "../employment/types";

builder.queryFields((t) => ({
  employmentsWithUser: t.fieldWithInput({
    type: [EmploymentWithUser],
    input: {
      gymId: t.input.string(),
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
        const employment: Employments__Output = await new Promise(
          (resolve, reject) => {
            client.getEmployments(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );

        const result = employment.employments.map(async (employment) => {
          const user = await ctx.prisma.user.findUnique({
            where: {
              id: employment.userId,
            },
          });

          if (!user) throw new NotFoundError("User not found");

          const { userId, ...rest } = employment;

          return {
            ...rest,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            },
            createdAt: new Date(employment.createdAt),
            updatedAt: new Date(employment.updatedAt),
          };
        });

        return result;
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

  employmentWithUser: t.fieldWithInput({
    type: EmploymentWithUser,
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
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const employment: Employment__Output = await new Promise(
          (resolve, reject) => {
            client.getEmployment(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );

        const user = await ctx.prisma.user.findUnique({
          where: {
            id: employment.userId,
          },
        });

        if (!user) throw new NotFoundError("User not found");

        const { userId, ...rest } = employment;

        return {
          ...rest,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
          createdAt: new Date(employment.createdAt),
          updatedAt: new Date(employment.updatedAt),
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
