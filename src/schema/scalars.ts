import { DateTimeResolver } from "graphql-scalars";

import { builder } from "~/schema/builder";

builder.addScalarType("Date", DateTimeResolver, {});
