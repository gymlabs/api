import client from "@gymlabs/admin.grpc.client";
import {
  Membership__Output,
  Memberships__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Membership, Memberships } from "./types";
import { builder } from "../builder";

builder.queryFields((t) => ({
  memberships: t.fieldWithInput({
    type: Memberships,
    input: {
      gymId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const memberships: Memberships__Output = await new Promise(
        (resolve, reject) => {
          client.getMemberships(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        }
      );
      return {
        memberships: memberships.memberships.map((membership) => ({
          ...membership,
          createdAt: new Date(membership.createdAt),
          updatedAt: new Date(membership.updatedAt),
        })),
      };
    },
  }),

  membership: t.fieldWithInput({
    type: Membership,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const membership: Membership__Output = await new Promise(
        (resolve, reject) => {
          client.getMembership(input, (err, res) => {
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
}));
