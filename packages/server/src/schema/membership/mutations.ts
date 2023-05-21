import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType,
  Membership__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Membership } from "./types";
import { builder } from "../builder";

builder.mutationFields((t) => ({
  createMembership: t.fieldWithInput({
    type: Membership,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
      contractId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      // TODO: check access rights
      const membership: Membership__Output = await new Promise(
        (resolve, reject) => {
          client.createMembership(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return {
        ...membership,
        createdAt: new Date(membership.createdAt),
        updatedAt: new Date(membership.updatedAt),
      };
    },
  }),

  activateMembership: t.fieldWithInput({
    type: "Boolean",
    input: {
      membershipId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      // TODO: check access rights
      const success: BooleanType = await new Promise((resolve, reject) => {
        client.activateMembership(input, (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      return success.value ?? false;
    },
  }),

  deleteMembership: t.fieldWithInput({
    type: "Boolean",
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      // TODO: check access rights
      const success: BooleanType = await new Promise((resolve, reject) => {
        client.deleteMembership(input, (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      return success.value ?? false;
    },
  }),
}));
