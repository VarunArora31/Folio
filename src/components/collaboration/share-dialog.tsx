"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Link, Check, Copy, X, Loader2, Crown, Eye, Pen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Role = "editor" | "viewer" | "commenter";

interface Collaborator {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: Role;
}

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  isOwner: boolean;
}

const ROLE_LABELS: Record<Role, string> = {
  editor: "Editor",
  viewer: "Viewer",
  commenter: "Commenter",
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  editor: <Pen className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
  commenter: <Eye className="h-3.5 w-3.5" />,
};

export function ShareDialog({ documentId, documentTitle, isOwner }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const documentUrl = typeof window !== "undefined"
    ? `${window.location.origin}/documents/${documentId}`
    : "";

  const loadCollaborators = useCallback(async () => {
    if (!isOwner) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [documentId, isOwner]);

  useEffect(() => {
    if (open) loadCollaborators();
  }, [open, loadCollaborators]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = documentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const invite = async () => {
    if (!email.trim()) return;
    setIsInviting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setEmail("");
        loadCollaborators();
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch {
      setMessage({ text: "Something went wrong", type: "error" });
    } finally {
      setIsInviting(false);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId }),
      });
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    } catch { /* ignore */ }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
          title="Share document"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{documentTitle}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">

          {/* ── Invite section (owner only) ── */}
          {isOwner && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Invite people</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && invite()}
                  className="flex-1"
                />
                {/* Role selector */}
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                </select>
                <Button
                  onClick={invite}
                  disabled={isInviting || !email.trim()}
                  size="sm"
                >
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                </Button>
              </div>

              {message && (
                <p className={`text-sm ${message.type === "error" ? "text-red-500" : "text-green-600"}`}>
                  {message.text}
                </p>
              )}
            </div>
          )}

          {/* ── Collaborators list ── */}
          <div className="space-y-2">
            <p className="text-sm font-medium">People with access</p>

            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No collaborators yet. Invite someone above.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(collab.name, collab.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{collab.name || collab.email}</p>
                      {collab.name && (
                        <p className="text-xs text-muted-foreground truncate">{collab.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {ROLE_ICONS[collab.role]}
                        {ROLE_LABELS[collab.role]}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => removeCollaborator(collab.id)}
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Owner row — always shown */}
            <div className="flex items-center gap-3 pt-1 border-t">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted">
                  <Crown className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">You</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Crown className="h-3.5 w-3.5" />
                Owner
              </span>
            </div>
          </div>

          {/* ── Copy link ── */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Copy link</p>
            <div className="flex gap-2">
              <Input readOnly value={documentUrl} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
                {copied ? (
                  <><Check className="h-4 w-4 mr-1 text-green-600" />Copied</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" />Copy</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Only people who have been invited can open this document.
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
