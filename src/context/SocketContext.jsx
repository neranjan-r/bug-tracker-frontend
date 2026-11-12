import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

const SERVER_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
)
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const hasDisconnectedRef = useRef(false);

  useEffect(() => {
    if (!token || !user) {
      hasDisconnectedRef.current = false;
      setConnected(false);
      setSocket(null);
      return undefined;
    }

    const instance = io(SERVER_ORIGIN, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    instance.on("connect", () => {
      setConnected(true);
      if (hasDisconnectedRef.current) {
        hasDisconnectedRef.current = false;
        setReconnectCount((c) => c + 1);
      }
    });

    instance.on("disconnect", () => {
      setConnected(false);
      hasDisconnectedRef.current = true;
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
      setConnected(false);
      hasDisconnectedRef.current = false;
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, connected, reconnectCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Subscribe to project-level real-time events while ignoring events triggered by
 * the current user, and run onReconnect when the socket reconnects after dropping.
 */
export function useProjectLiveUpdates({ onEvent, onReconnect }) {
  const { user } = useAuth();
  const { socket, reconnectCount } = useSocket() || {};
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (!socket) return undefined;

    const eventNames = [
      "ticket:created",
      "ticket:updated",
      "ticket:moved",
      "ticket:deleted",
      "comment:created",
      "comment:updated",
      "comment:deleted",
    ];

    const listeners = eventNames.map((name) => {
      const handler = (payload) => {
        if (payload?.actorId && payload.actorId === user?.id) {
          return;
        }
        onEventRef.current?.(name, payload);
      };
      socket.on(name, handler);
      return { name, handler };
    });

    return () => {
      for (const { name, handler } of listeners) {
        socket.off(name, handler);
      }
    };
  }, [socket, user?.id]);

  useEffect(() => {
    if (reconnectCount > 0) {
      onReconnectRef.current?.();
    }
  }, [reconnectCount]);
}

