import "./user";
import "./gyms";
import "./workouts";
import "./exercises";
import "./scalars";
import { builder } from "./builder";

export const schema = builder.toSchema();
