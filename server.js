const express = require("express");
const http = require("http");
const cors = require("cors");
const { ExpressPeerServer } = require("peer");

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: "https://editorverse.com",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const peerServer = ExpressPeerServer(server, {
    proxied: true,
    allow_discovery: true
});

app.use("/", peerServer);

server.listen(9000, () => {
    console.log("PeerJS server running");
});