"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "db", {
    enumerable: true,
    get: ()=>db
});
const _client = require("@prisma/client");
const _config = require("./config");
let db;
if (_config.config.nodeEnv === "production") {
    db = new _client.PrismaClient();
} else {
    global.__db ??= new _client.PrismaClient();
    db = global.__db;
}
