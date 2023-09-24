import "./contracts";
import "./employments";
import "./exercises";
import "./gyms";
import "./invitations";
import "./memberships";
import "./organizations";
import "./posts";
import "./roles";
import "./users";
import "./workouts";
import "./scalars";
import { builder } from "./builder";

export const schema = builder.toSchema();
