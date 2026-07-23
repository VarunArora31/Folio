"use client";

import { Wifi, WifiOff, Loader2, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isSynced: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, isSynced, className }: ConnectionStatusProps) {
  // Wait 2s before showing "Offline" — avoids flash during initial connect
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setShowOffline(false);
      return;
    }
    const timer = setTimeout(() => setShowOffline(true), 2000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  const getStatus = () => {
    if (isConnected && isSynced) {
      return { icon: Cloud, text: "Saved", color: "text-green-600", bgColor: "bg-green-50" };
    }

    if (isConnected && !isSynced) {
      return { icon: Loader2, text: "Syncing...", color: "text-yellow-600", bgColor: "bg-yellow-50", spin: true };
    }

    if (!isConnected && showOffline) {
      return { icon: WifiOff, text: "Offline", color: "text-red-500", bgColor: "bg-red-50" };
    }

    // Connecting state — shown for first 2s
    return { icon: Loader2, text: "Connecting...", color: "text-blue-500", bgColor: "bg-blue-50", spin: true };
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
      <Icon className={cn("h-4 w-4", (status as any).spin && "animate-spin")} />
      <span>{status.text}</span>
    </div>
  );
}
