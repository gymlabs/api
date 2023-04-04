"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getContext: ()=>getContext,
    Viewer: ()=>Viewer
});
const _cookie = /*#__PURE__*/ _interop_require_default(require("cookie"));
const _db = require("./db");
const _errors = require("./errors");
const _security = require("./lib/security");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function getContext({ request , req , res  }) {
    const authorizationHeader = request.headers.get("Authorization");
    const cookieHeader = request.headers.get("Cookie");
    let bearerToken = null;
    // prefer authorization header and fallback to "bearerToken" cookie
    if (authorizationHeader) {
        bearerToken = (0, _security.extractBearerToken)(authorizationHeader);
    } else if (cookieHeader) {
        const cookies = _cookie.default.parse(cookieHeader);
        bearerToken = cookies["accessToken"] ?? null;
    }
    let viewer;
    if (bearerToken && bearerToken.length > 0) {
        const hashedBearerToken = (0, _security.hashToken)(bearerToken);
        const accessToken = await _db.db.accessToken.findUnique({
            where: {
                token: hashedBearerToken
            },
            // TODO: double join in every request is not ideal
            include: {
                user: {
                    include: {
                        memberships: true,
                        employments: true
                    }
                }
            }
        });
        if (!accessToken) {
            throw new _errors.InvalidAccessTokenError();
        }
        // check token expiration
        const now = new Date();
        if (accessToken.expiresAt < now) {
            throw new _errors.InvalidAccessTokenError();
        }
        // authenicated viewer
        viewer = new Viewer({
            user: accessToken.user,
            accessToken
        });
    } else {
        // anonymous viewer
        viewer = new Viewer();
    }
    return {
        request,
        viewer,
        accessToken: bearerToken,
        req,
        res
    };
}
class Viewer {
    user;
    accessToken;
    /**
   * creates a new viewer instance. if options are not provided, the viewer is
   * considered anonymous.
   */ constructor(options){
        this.user = options?.user ?? null;
        this.accessToken = options?.accessToken ?? null;
    }
    isAuthenticated() {
        return this.user !== null;
    }
    isAnonymous() {
        return !this.isAuthenticated();
    }
    isGymEmployee(gymId) {
        return this.user?.memberships.some((m)=>m.gymId === gymId);
    }
    isGymManagement(gymId) {
        const employments = this.user?.employments ?? [];
        return employments.find((e)=>e.gymId === gymId && e.role === "MANAGEMENT") !== undefined;
    }
}
