import { useEffect, useRef, useState } from "react";

export type CrooEvent = {
  type: string;
  timestamp?: string;
  [k: string]: unknown;
};

export type StreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

/**
 * Live event stream directly from wss://api.croo.network/ws?key=croo_sk_...
 * Auth is a query param (per official CROO Node SDK — src/ws.ts uses `key`).
 * Reconnects with exponential backoff up to 30s. Runs browser-side only.
 */
export function useCrooStream(sdkKey: string | null, onEvent: (e: CrooEvent) => void) {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [events, setEvents] = useState<CrooEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const closedRef = useRef(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!sdkKey || !sdkKey.startsWith("croo_sk_")) {
      setStatus("idle");
      return;
    }
    closedRef.current = false;

    const connect = () => {
      if (closedRef.current) return;
      setStatus("connecting");
      const url = `wss://api.croo.network/ws?key=${encodeURIComponent(sdkKey)}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        setStatus("error");
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setStatus("open");
      };
      ws.onmessage = (msg) => {
        let parsed: CrooEvent;
        try {
          parsed = typeof msg.data === "string" ? JSON.parse(msg.data) : { type: "binary" };
        } catch {
          parsed = { type: "raw", data: String(msg.data) };
        }
        parsed.timestamp = parsed.timestamp || new Date().toISOString();
        setEvents((prev) => [parsed, ...prev].slice(0, 200));
        try {
          onEventRef.current(parsed);
        } catch {
          /* swallow handler errors */
        }
      };
      ws.onerror = () => setStatus("error");
      ws.onclose = () => {
        setStatus("closed");
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      attemptRef.current += 1;
      const delay = Math.min(1000 * 2 ** (attemptRef.current - 1), 30_000);
      setTimeout(connect, delay);
    };

    connect();

    return () => {
      closedRef.current = true;
      try {
        wsRef.current?.close(1000, "unmount");
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [sdkKey]);

  return { status, events, clear: () => setEvents([]) };
}
