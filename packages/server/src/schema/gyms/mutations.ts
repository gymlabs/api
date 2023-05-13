import client from "@gymlabs/admin.grpc.client";
import { Gym__Output } from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { mapNullToUndefined } from "packages/server/src/lib/mapNullToUndefined";
import { builder } from "packages/server/src/schema/builder";

builder.mutationFields((t) => ({
  createGym: t.fieldWithInput({
    type: "Gym",
    input: {
      name: t.input.string(),
      organizationId: t.input.string(),
      city: t.input.string(),
      country: t.input.string(),
      description: t.input.string(),
      postalCode: t.input.string(),
      street: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const gym: Gym__Output = await new Promise((resolve, reject) => {
        client.createGym(input, (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      return gym;
    },
  }),
  updateGym: t.fieldWithInput({
    type: "Gym",
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
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const gym: Gym__Output = await new Promise((resolve, reject) => {
        client.updateGym(mapNullToUndefined(input), (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      return gym;
    },
  }),
}));
