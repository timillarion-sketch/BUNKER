import { useEffect, useState, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const SIGNAL_SERVER_URL = import.meta.env.VITE_SIGNAL_SERVER_URL ?? "wss://176.12.72.246";

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

export function useMeshSocket(enabled: boolean) {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatus("disconnected");
      return;
    }

    const socket = io(`${SIGNAL_SERVER_URL}/mesh`, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    setStatus("connecting");

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    socket.emit("join-mesh", {});

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setStatus("disconnected");
    };
  }, [enabled]);

  return { status, socket: socketRef.current };
}
