import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { redis, redisSub } from "../redis";
import { auth } from "../auth";

export function setupWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Map to track user connections: userId -> Set of WebSockets
  const userConnections = new Map<string, Set<WebSocket>>();

  httpServer.on("upgrade", async (request, socket, head) => {
    // Authenticate user from request headers/cookies
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, session.user);
    });
  });

  wss.on("connection", (ws, user) => {
    const userId = user.id;
    const orgId = user.orgId;

    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(ws);

    console.log(`[WS] User ${userId} connected`);

    ws.on("close", () => {
      userConnections.get(userId)?.delete(ws);
      if (userConnections.get(userId)?.size === 0) {
        userConnections.delete(userId);
      }
      console.log(`[WS] User ${userId} disconnected`);
    });

    // Handle incoming messages from client if needed
    ws.on("message", (data) => {
      // In this architecture, clients mostly send via tRPC (HTTP)
      // and receive updates via WebSocket.
    });
  });

  // Subscribe to Redis channels for cross-instance broadcasting
  redisSub.psubscribe("org:*:*", (err) => {
    if (err) console.error("[Redis] Subscription error:", err);
  });

  redisSub.on("pmessage", (pattern, channel, message) => {
    // channel format: org:{orgId}:chat or org:{orgId}:notifications
    const [_, orgId, type] = channel.split(":");
    const data = JSON.parse(message);

    // Broadcast to all connected clients in the org
    // In a more complex setup, we'd filter by userId for DMs/notifications
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // We'd need to attach user/org info to the client object
        // For now, this is a simplified broadcast
        client.send(JSON.stringify({ type, data }));
      }
    });
  });
}
