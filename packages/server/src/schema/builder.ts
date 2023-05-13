import { Gym__Output, Gyms__Output } from "@gymlabs/admin.grpc.definition";
import type PrismaTypes from "@gymlabs/core.db/dist/photos-types";
import SchemaBuilder from "@pothos/core";
import ErrorsPlugin from "@pothos/plugin-errors";
// eslint-disable-next-line import/no-named-as-default
import PrismaPlugin from "@pothos/plugin-prisma";
import RelayPlugin from "@pothos/plugin-relay";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import ValidationPlugin from "@pothos/plugin-validation";
import WithInputPlugin from "@pothos/plugin-with-input";
import { SetNonNullable } from "type-fest";

import { Context, Viewer } from "../context";
import { db } from "../db";
import { ForbiddenError } from "../errors";

export const builder = new SchemaBuilder<{
  Context: Context;
  DefaultInputFieldRequiredness: true;
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
    Gyms: {
      Input: Gyms__Output;
      Output: Gyms__Output;
    };
    Gym: {
      Input: Gym__Output;
      Output: Gym__Output;
    };
  };
  AuthScopes: {
    authenticated: boolean;
  };
  AuthContexts: {
    authenticated: Context & {
      viewer: SetNonNullable<Viewer, "user" | "accessToken">;
    };
  };
  PrismaTypes: PrismaTypes;
  DefaultEdgesNullability: false;
  DefaultNodeNullability: false;
}>({
  defaultInputFieldRequiredness: true,
  plugins: [
    ScopeAuthPlugin,
    ErrorsPlugin,
    RelayPlugin,
    PrismaPlugin,
    WithInputPlugin,
    ValidationPlugin,
    SimpleObjectsPlugin,
  ],
  authScopes: (context) => ({
    authenticated: context.viewer.isAuthenticated() !== null,
  }),
  scopeAuthOptions: {
    unauthorizedError: (parent, context, info, result) =>
      new ForbiddenError(result.message),
  },
  prisma: {
    client: db,
  },
  relayOptions: {
    idFieldName: "globalId",
    clientMutationId: "omit",
    cursorType: "ID",
    edgesFieldOptions: {
      nullable: false,
    },
    nodeFieldOptions: {
      nullable: false,
    },
  },
  withInput: {},
  validationOptions: {},
  errorOptions: {
    defaultTypes: [],
  },
});

// init them here so they can be expanded with queryFields or mutationFields in the individual modules
builder.queryType({});
builder.mutationType({});
