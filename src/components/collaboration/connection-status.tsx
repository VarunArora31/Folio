"use client";

import { Wifi, WifiOff, CloudOff, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  isSynced: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, isSynced, className }: ConnectionStatusProps) {
  const getStatus = () => {
    if (!isConnected) {
      return {
        icon: WifiOff,
        text: "Offline",
        color: "text-red-500",
        bgColor: "bg-red-50",
      };
    }

    if (!isSynced) {
      return {
        icon: CloudOff,
        text: "Syncing...",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      };
    }

    return {
      icon: Cloud,
      text: "Saved",
      color: "text-green-600",
      bgColor: "bg-green-50",
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium",
        status.bgColor,
        status.color,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{status.text}</span>
    </div>
  );
}
