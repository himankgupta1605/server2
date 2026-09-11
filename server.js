const express = require("express");
const http = require("http");
const cors = require("cors");
const { ExpressPeerServer } = require("peer");

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: [
        "https://editorverse.com",
        "https://boisterous-pastelito-698a7b.netlify.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.get("/api/turn-credentials", async (req, res) => {
    try {
        const turnKeyId = process.env.TURN_KEY_ID;
        const turnApiToken = process.env.TURN_KEY_API_TOKEN;

        if (!turnKeyId || !turnApiToken) {
            console.error("Cloudflare TURN environment variables are missing");

            return res.status(500).json({
                error: "TURN server configuration missing"
            });
        }

        const response = await fetch(
            `https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${turnApiToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ttl: 86400
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Cloudflare TURN error:", data);

            return res.status(response.status).json({
                error: "Failed to generate TURN credentials",
                details: data
            });
        }

        // Send Cloudflare's ICE configuration to browser
        res.json({
            iceServers: data.iceServers
        });

    } catch (error) {
        console.error("TURN credential generation failed:", error);

        res.status(500).json({
            error: "TURN credential generation failed"
        });
    }
});

const peerServer = ExpressPeerServer(server, {
    proxied: true,
    allow_discovery: true
});

app.use("/", peerServer);

server.listen(9000, () => {
    console.log("PeerJS server running");
});
