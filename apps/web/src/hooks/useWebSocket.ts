import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}`;

      try {
        ws.current = new WebSocket(url);
      } catch {
        return;
      }

      ws.current.onopen = () => {
        if (process.env.NODE_ENV === "development") console.log("[WS] Connected");
      };

      ws.current.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          switch (type) {
            case "chat":
              utils.chat.getMessages.invalidate({ channelId: data.channelId });
              break;
            case "notifications":
              utils.notifications.getUnreadCount.invalidate();
              utils.notifications.list.invalidate();
              toast.info(data.title, { description: data.body });
              break;
            case "task_update":
              utils.tasks.list.invalidate();
              break;
          }
        } catch {}
      };

      ws.current.onclose = () => {
        if (!stopped) reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      ws.current?.close();
    };
  }, [utils]);

  return ws.current;
}
