import { createContext } from "react";
import * as signalR from "@microsoft/signalr";

export interface NotificationContextValue {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
}

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

