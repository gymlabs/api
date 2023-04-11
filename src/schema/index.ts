import "./user";
import "./scalars";
import { builder } from "./builder";

export const schema = builder.toSchema();
