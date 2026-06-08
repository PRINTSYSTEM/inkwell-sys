// src/providers/NotificationProvider.tsx
import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import { useAuthContext } from "@/context/auth-context";
import { NotificationContext } from "@/context/notification-context";
import { useQueryClient } from "@tanstack/react-query";
import { debtNotificationKeys } from "@/hooks/use-debt-notification";
import { orderKeys } from "@/hooks/use-order";

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
  const queryClient = useQueryClient();
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

    // Handler function để xử lý thông báo real-time
    const handleNotification = (message: NotificationMessage) => {
      // 1. Hiển thị Toast thông báo cho người dùng
      toast(message.title, {
        description: message.message,
        duration: 8000,
        action: message.data?.customerId
          ? {
              label: "Xem khách hàng",
              onClick: () =>
                (window.location.href = `/customers/${message.data.customerId}`),
            }
          : undefined,
      });

      // 2. Tự động làm mới dữ liệu (Refetch) dựa trên loại thông báo
      switch (message.type) {
        case "DebtApproved":
        case "CustomerDebtWarning":
          // Làm mới danh sách thông báo công nợ và số lượng trên chuông
          queryClient.invalidateQueries({ queryKey: debtNotificationKeys.all });
          break;

        case "OrderStatusChanged":
          // Làm mới danh sách đơn hàng và chi tiết đơn hàng nếu có ID
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          if (message.data?.orderId) {
            queryClient.invalidateQueries({ 
              queryKey: orderKeys.detail(Number(message.data.orderId)) 
            });
          }
          break;

        case "ProductionCompleted":
        case "ProductionStarted":
          queryClient.invalidateQueries({ queryKey: ["productions"] });
          break;

        default:
          // Mặc định làm mới thông báo chung
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          break;
      }
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
