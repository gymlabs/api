import client from "@gymlabs/admin.grpc.client";
import {
  BooleanType,
  Employment__Output,
} from "@gymlabs/admin.grpc.definition";
import { ZodError } from "zod";

import { Employment } from "./types";
import { builder } from "../builder";

builder.mutationFields((t) => ({
  createEmployment: t.fieldWithInput({
    type: Employment,
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
      role: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      // TODO: check access rights
      const employment: Employment__Output = await new Promise(
        (resolve, reject) => {
          client.createEmployment(input, (err, res) => {
            if (err || !res) {
              reject(err);
            } else {
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
    },
  }),

  activateEmployment: t.fieldWithInput({
    type: "Boolean",
    input: {
      employmentId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      // TODO: check access rights
      const success: BooleanType = await new Promise((resolve, reject) => {
        client.activateEmployment(input, (err, res) => {
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

  deleteEmployment: t.fieldWithInput({
    type: "Boolean",
    input: {
      gymId: t.input.string(),
      userId: t.input.string(),
    },
    errors: { types: [ZodError] },
    resolve: async (query, { input }, args, context) => {
      // TODO: check access rights
      const success: BooleanType = await new Promise((resolve, reject) => {
        client.deleteEmployment(input, (err, res) => {
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
