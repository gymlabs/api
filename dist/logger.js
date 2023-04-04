"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "logger", {
    enumerable: true,
    get: ()=>logger
});
const _pino = /*#__PURE__*/ _interop_require_default(require("pino"));
const _config = require("./config");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const logger = (0, _pino.default)({
    level: _config.config.logging.level
});
