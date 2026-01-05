// src/providers/NotificationProvider.tsx
import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import { useAuthContext } from "@/context/auth-context";
import { NotificationContext } from "@/context/notification-context";

interface NotificationMessage {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { accessToken, isAuthenticated } = useAuthContext();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      const currentConnection = connectionRef.current;
      if (currentConnection) {
        currentConnection.off("ReceiveNotification");
        currentConnection.stop().catch((err) => {
          console.error("Error stopping SignalR connection: ", err);
        });
        connectionRef.current = null;
        setConnection(null);
        setIsConnected(false);
      }
      return;
    }

    // SignalR hub is at /hub/notifications (not /api/hub/notifications)
    // Remove /api suffix from base URL if present
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(
      /\/api\/?$/,
      ""
    );
    const hubUrl = `${baseUrl}/hub/notifications`;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => accessToken,
        // Use LongPolling on localhost to avoid SSL/WebSocket issues
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Handler function để có thể remove sau
    const handleNotification = (message: NotificationMessage) => {
      // Hiển thị toast dựa trên type
      toast(message.title, {
        description: message.message,
        duration: 8000, // Cảnh báo quan trọng nên hiện lâu hơn
        action: message.data?.customerId
          ? {
              label: "Xem khách hàng",
              onClick: () =>
                (window.location.href = `/customers/detail/${message.data.customerId}`),
            }
          : undefined,
      });
    };

    newConnection.on("ReceiveNotification", handleNotification);

    let isMounted = true;

    newConnection
      .start()
      .then(() => {
        if (isMounted) {
          connectionRef.current = newConnection;
          setIsConnected(true);
          setConnection(newConnection);
        }
      })
      .catch((err) => {
        console.error("SignalR Connection Error: ", err);
        if (isMounted) {
          toast.error("Lỗi kết nối", {
            description:
              "Không thể kết nối tới server thông báo. Một số thông báo có thể bị trễ.",
            duration: 5000,
          });
        }
      });

    return () => {
      isMounted = false;
      // Remove event handler trước khi stop
      newConnection.off("ReceiveNotification", handleNotification);
      newConnection.stop().catch((err) => {
        console.error("Error stopping SignalR connection: ", err);
      });
      if (connectionRef.current === newConnection) {
        connectionRef.current = null;
      }
    };
  }, [accessToken, isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ connection, isConnected }}>
      {children}
    </NotificationContext.Provider>
  );
};
