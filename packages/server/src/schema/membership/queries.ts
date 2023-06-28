import * as grpc from "@grpc/grpc-js";
import client from "@gymlabs/admin.grpc.client";
import {
  Membership__Output,
  Memberships__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { MembershipWithUser } from "./types";
import { meta } from "../../lib/metadata";
import { builder } from "../builder";
import {
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors";

builder.queryFields((t) => ({
  membershipsWithUser: t.fieldWithInput({
    type: [MembershipWithUser],
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
        const memberships: Memberships__Output = await new Promise(
          (resolve, reject) => {
            client.getMemberships(input, meta(ctx.viewer), (err, res) => {
              if (err) {
                reject(err);
              } else if (res) {
                resolve(res);
              }
            });
          }
        );

        const result = memberships.memberships.map(async (membership) => {
          const user = await ctx.prisma.user.findUnique({
            where: {
              id: membership.userId,
            },
          });

          if (!user) throw new NotFoundError("User not found");

          const { userId, ...rest } = membership;

          return {
            ...rest,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            },
            createdAt: new Date(membership.createdAt),
            updatedAt: new Date(membership.updatedAt),
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

  membershipWithUser: t.fieldWithInput({
    type: MembershipWithUser,
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
    resolve: async (query, { input }, ctx) => {
      if (!ctx.viewer.isAuthenticated()) throw new UnauthenticatedError();
      try {
        const membership: Membership__Output = await new Promise(
          (resolve, reject) => {
            client.getMembership(input, meta(ctx.viewer), (err, res) => {
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
            id: membership.userId,
          },
        });

        if (!user) throw new NotFoundError("User not found");

        const { userId, ...rest } = membership;

        return {
          ...rest,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
          createdAt: new Date(membership.createdAt),
          updatedAt: new Date(membership.updatedAt),
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
