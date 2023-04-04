"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "config", {
    enumerable: true,
    get: ()=>config
});
const _ms = /*#__PURE__*/ _interop_require_default(require("ms"));
const _zod = require("zod");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const validatedEnv = _zod.z.object({
    DATABASE_URL: _zod.z.string().url(),
    DEBUG: _zod.z.enum([
        "true",
        "false"
    ]).default("false").transform((v)=>v === "true"),
    NODE_ENV: _zod.z.enum([
        "development",
        "production"
    ])
}).safeParse(process.env);
if (!validatedEnv.success) {
    // cannot use logger here because it depends on config
    console.error("❌ Invalid environment variables:", JSON.stringify(validatedEnv.error.flatten().fieldErrors, null, 2));
    process.exit(1);
}
const { data: env  } = validatedEnv;
const config = {
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL,
    server: {
        host: "localhost",
        port: 8000
    },
    logging: {
        level: env.DEBUG ? "debug" : "info"
    },
    security: {
        passwordResetRequestLifetime: (0, _ms.default)("1d"),
        accessTokenLifetime: (0, _ms.default)("1y"),
        bcryptSaltRounds: 10,
        cookie: {
            secure: env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "strict"
        }
    }
};
