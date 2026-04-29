import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}`;

    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("[WS] Connected");
      };

      ws.current.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);

        switch (type) {
          case "chat":
            // Invalidate chat messages cache
            utils.chat.getMessages.invalidate({ channelId: data.channelId });
            break;
          case "notifications":
            // Invalidate notification count and list
            utils.notifications.getUnreadCount.invalidate();
            utils.notifications.list.invalidate();
            toast.info(data.title, { description: data.body });
            break;
          case "task_update":
            utils.tasks.list.invalidate();
            break;
        }
      };

      ws.current.onclose = () => {
        console.log("[WS] Disconnected. Reconnecting in 3s...");
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error("[WS] Error:", err);
        ws.current?.close();
      };
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, [utils]);

  return ws.current;
}
