import client from "@gymlabs/admin.grpc.client";
import { Gym__Output, Gyms__Output } from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { builder } from "../builder";
import { Gym, Gyms } from "../gyms/types";

builder.queryFields((t) => ({
  gyms: t.fieldWithInput({
    type: Gyms,
    input: {
      organizationId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const gyms: Gyms__Output = await new Promise((resolve, reject) => {
        client.getGyms({ organizationId: input.organizationId }, (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      return {
        gyms: gyms.gyms.map((gym) => ({
          ...gym,
          createdAt: new Date(gym.createdAt),
          updatedAt: new Date(gym.updatedAt),
        })),
      };
    },
  }),
  gym: t.fieldWithInput({
    type: Gym,
    input: {
      id: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      const gym: Gym__Output = await new Promise((resolve, reject) => {
        client.getGym({ id: input.id }, (err, res) => {
          if (err || !res) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      return {
        ...gym,
        createdAt: new Date(gym.createdAt),
        updatedAt: new Date(gym.updatedAt),
      };
    },
  }),
}));
