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
        <div className="space-y-3 p-4 bg-[#f8f9fa] rounded-xl border border-[#dadce0]">
          <p className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
            Create Share Link
          </p>

          {/* Access level - segmented control */}
          <div>
            <label className="block text-xs text-[#5f6368] mb-1.5">
              Access Level
            </label>
            <div className="inline-flex rounded-lg border border-[#dadce0] overflow-hidden">
              {ACCESS_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() =>
                    setAccessLevel(level.value as "view" | "comment" | "edit")
                  }
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all border-r last:border-r-0 border-[#dadce0] ${
                    accessLevel === level.value
                      ? "bg-[#e8f0fe] text-[#1a73e8]"
                      : "bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
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
                isClientView ? "bg-[#1a73e8]" : "bg-[#dadce0]"
              }`}
              onClick={() => setIsClientView(!isClientView)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  isClientView ? "translate-x-4" : ""
                }`}
              />
            </div>
            <div>
              <span className="text-xs font-medium text-[#202124]">
                Client View
              </span>
              <p className="text-[10px] text-[#5f6368]">
                Hides internal notes column
              </p>
            </div>
          </label>

          {/* Password toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                passwordProtected ? "bg-[#1a73e8]" : "bg-[#dadce0]"
              }`}
              onClick={() => setPasswordProtected(!passwordProtected)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  passwordProtected ? "translate-x-4" : ""
                }`}
              />
            </div>
            <div>
              <span className="text-xs font-medium text-[#202124]">
                Password Protection
              </span>
            </div>
          </label>

          {passwordProtected && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#80868b]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-white border border-[#dadce0] rounded-lg pl-8 pr-3 py-2 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] transition-colors"
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
          <p className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider mb-2">
            Active Links
          </p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[#80868b]" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-xs text-[#80868b] text-center py-4">
              No active share links.
            </p>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 p-3 bg-[#f8f9fa] border border-[#dadce0] rounded-lg"
                >
                  <Globe className="h-4 w-4 text-[#80868b] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#202124] font-mono truncate">
                      {share.link}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#5f6368] capitalize">
                        {share.accessLevel}
                      </span>
                      {share.isClientView && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e8f0fe] text-[#1a73e8]">
                          Client
                        </span>
                      )}
                      {share.hasPassword && (
                        <Lock className="h-3 w-3 text-[#e8710a]" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyLink(share.link)}
                    className="p-1.5 rounded text-[#80868b] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteShare(share.id)}
                    className="p-1.5 rounded text-[#80868b] hover:text-[#d93025] hover:bg-[#fce8e6] transition-colors"
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
