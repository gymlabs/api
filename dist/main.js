"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const http = require("http");
const server = http.createServer((req, res)=>{
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello, SWC!');
});
const port = process.env.PORT || 3000;
server.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
