// src/providers/NotificationProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import { useAuthContext } from "@/context/auth-context";

interface NotificationMessage {
    type: string;
    title: string;
    message: string;
    data?: any;
    timestamp: string;
}

interface NotificationContextValue {
    connection: signalR.HubConnection | null;
    isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accessToken, isAuthenticated } = useAuthContext();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            if (connection) {
                connection.stop();
                setConnection(null);
                setIsConnected(false);
            }
            return;
        }

        // SignalR hub is at /hub/notifications (not /api/hub/notifications)
        // Remove /api suffix from base URL if present
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        const hubUrl = `${baseUrl}/hub/notifications`;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => accessToken,
                // Use LongPolling on localhost to avoid SSL/WebSocket issues
                transport: signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        newConnection.on("ReceiveNotification", (message: NotificationMessage) => {
            console.log("🔔 Notification received:", message);

            // Hiển thị toast dựa trên type
            toast(message.title, {
                description: message.message,
                duration: 8000, // Cảnh báo quan trọng nên hiện lâu hơn
                action: message.data?.customerId ? {
                    label: "Xem khách hàng",
                    onClick: () => window.location.href = `/customers/detail/${message.data.customerId}`
                } : undefined
            });
        });

        newConnection.start()
            .then(() => {
                console.log("📡 Connected to NotificationHub");
                setIsConnected(true);
                setConnection(newConnection);
            })
            .catch(err => {
                console.error("❌ SignalR Connection Error: ", err);
            });

        return () => {
            newConnection.stop();
        };
    }, [accessToken, isAuthenticated]);

    return (
        <NotificationContext.Provider value={{ connection, isConnected }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};
