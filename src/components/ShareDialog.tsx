"use client";

import React, { useState, useEffect } from "react";
import {
  Link2,
  Copy,
  Trash2,
  Eye,
  MessageSquare,
  Edit3,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Button from "./Button";

interface Share {
  id: string;
  link: string;
  accessLevel: "view" | "comment" | "edit";
  isClientView: boolean;
  hasPassword: boolean;
  createdAt: string;
}

interface ShareDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ACCESS_LEVELS = [
  { value: "view", label: "View only", icon: <Eye className="h-3.5 w-3.5" /> },
  {
    value: "comment",
    label: "Can comment",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
  { value: "edit", label: "Can edit", icon: <Edit3 className="h-3.5 w-3.5" /> },
];

export default function ShareDialog({
  projectId,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [accessLevel, setAccessLevel] = useState<"view" | "comment" | "edit">(
    "view"
  );
  const [isClientView, setIsClientView] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetchShares();
  }, [isOpen, projectId]);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shares?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setShares(data);
      }
    } catch {
      toast.error("Failed to load shares");
    } finally {
      setLoading(false);
    }
  };

  const createShare = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          accessLevel,
          isClientView,
          password: passwordProtected ? password : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShares((prev) => [...prev, data]);
        await navigator.clipboard.writeText(data.link);
        toast.success("Share link created and copied!");
        setPassword("");
        setPasswordProtected(false);
      }
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      await fetch(`/api/shares/${shareId}`, { method: "DELETE" });
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      toast.success("Share link deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Project" size="md">
      <div className="space-y-5">
        {/* Create new share */}
        <div className="space-y-3 p-4 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a]">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">
            Create Share Link
          </p>

          {/* Access level */}
          <div>
            <label className="block text-xs text-[#666] mb-1.5">
              Access Level
            </label>
            <div className="flex gap-2">
              {ACCESS_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() =>
                    setAccessLevel(level.value as "view" | "comment" | "edit")
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    accessLevel === level.value
                      ? "border-[#6366f1] bg-[#6366f1]/10 text-[#818cf8]"
                      : "border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a]"
                  }`}
                >
                  {level.icon}
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client view toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                isClientView ? "bg-[#6366f1]" : "bg-[#2a2a2a]"
              }`}
              onClick={() => setIsClientView(!isClientView)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isClientView ? "translate-x-4" : ""
                }`}
              />
            </div>
            <div>
              <span className="text-xs font-medium text-[#e5e5e5]">
                Client View
              </span>
              <p className="text-[10px] text-[#666]">
                Hides internal notes column
              </p>
            </div>
          </label>

          {/* Password toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                passwordProtected ? "bg-[#6366f1]" : "bg-[#2a2a2a]"
              }`}
              onClick={() => setPasswordProtected(!passwordProtected)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  passwordProtected ? "translate-x-4" : ""
                }`}
              />
            </div>
            <div>
              <span className="text-xs font-medium text-[#e5e5e5]">
                Password Protection
              </span>
            </div>
          </label>

          {passwordProtected && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-sm text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
              />
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<Link2 className="h-4 w-4" />}
            loading={creating}
            onClick={createShare}
            className="w-full"
          >
            Generate Share Link
          </Button>
        </div>

        {/* Existing shares */}
        <div>
          <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">
            Active Links
          </p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[#666]" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-xs text-[#666] text-center py-4">
              No active share links.
            </p>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg"
                >
                  <Globe className="h-4 w-4 text-[#666] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#e5e5e5] font-mono truncate">
                      {share.link}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#666] capitalize">
                        {share.accessLevel}
                      </span>
                      {share.isClientView && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6366f1]/10 text-[#818cf8]">
                          Client
                        </span>
                      )}
                      {share.hasPassword && (
                        <Lock className="h-3 w-3 text-[#f59e0b]" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyLink(share.link)}
                    className="p-1.5 rounded text-[#666] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteShare(share.id)}
                    className="p-1.5 rounded text-[#666] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
