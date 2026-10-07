import http from "http";
import path from "path";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import { apiRouter } from "./src/server/routes/api.ts";
import { operatorRouter } from "./src/server/routes/operatorApi.ts";
import { setupSocketIO } from "./src/server/sockets/socketHandler.ts";
dotenv.config();
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRouter);
app.use("/api/ops", operatorRouter);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 1e4,
  pingInterval: 5e3
});
setupSocketIO(io);
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware mounted in development mode");
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Serving production build from /dist");
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Apex Arcade server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
