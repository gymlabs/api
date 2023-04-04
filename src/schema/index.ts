import "./user";
import "./scalars";
import { builder } from "~/schema/builder";

export const schema = builder.toSchema();
