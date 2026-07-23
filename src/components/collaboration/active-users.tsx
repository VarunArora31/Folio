"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { CollaborationUser } from "@/hooks/use-collaboration";

interface ActiveUsersProps {
  users: CollaborationUser[];
  className?: string;
  maxVisible?: number;
}

export function ActiveUsers({ users, className, maxVisible = 3 }: ActiveUsersProps) {
  if (users.length === 0) {
    return null;
  }

  // Deduplicate by userId — same user can appear multiple times if they
  // have multiple tabs open
  const uniqueUsers = users.filter(
    (user, index, self) => self.findIndex((u) => u.userId === user.userId) === index
  );

  const visibleUsers = uniqueUsers.slice(0, maxVisible);
  const remainingCount = uniqueUsers.length - maxVisible;

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={cn("flex items-center", className)}>
      {/* Active users indicator text */}
      <span className="text-sm text-muted-foreground mr-2">
        {uniqueUsers.length} {uniqueUsers.length === 1 ? "editor" : "editors"} online
      </span>

      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={`${user.userId}-${index}`}
            className="relative ring-2 ring-background rounded-full"
            title={user.name}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                style={{ backgroundColor: user.color }}
                className="text-white text-xs font-semibold"
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {/* Active indicator dot */}
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
        ))}

        {/* Show "+N more" if there are additional users */}
        {remainingCount > 0 && (
          <div className="relative ring-2 ring-background rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
}
