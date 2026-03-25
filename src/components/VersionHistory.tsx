"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Copy,
  Eye,
  Loader2,
  GitBranch,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "./Button";

interface Version {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  sections: {
    id: string;
    title: string;
    rows: { col1: string; col2: string; col3: string }[];
  }[];
}

interface VersionHistoryProps {
  scriptId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectVersion: (scriptId: string) => void;
}

export default function VersionHistory({
  scriptId,
  isOpen,
  onClose,
  onSelectVersion,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [compareLeft, setCompareLeft] = useState<string | null>(null);
  const [compareRight, setCompareRight] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchVersions();
  }, [isOpen, scriptId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
        if (data.length >= 2) {
          setCompareLeft(data[data.length - 2]?.id || null);
          setCompareRight(data[data.length - 1]?.id || null);
        }
      }
    } catch {
      toast.error("Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Created V${data.version}`);
        fetchVersions();
      }
    } catch {
      toast.error("Failed to duplicate");
    } finally {
      setDuplicating(false);
    }
  };

  const leftVersion = versions.find((v) => v.id === compareLeft);
  const rightVersion = versions.find((v) => v.id === compareRight);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[600px] bg-[#0a0a0a] border-l border-[#2a2a2a] z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
        <h3 className="text-sm font-semibold text-[#e5e5e5] flex items-center gap-2">
          <History className="h-4 w-4 text-[#6366f1]" />
          Version History
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" />}
            loading={duplicating}
            onClick={handleDuplicate}
          >
            Duplicate as New Version
          </Button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#666] hover:text-[#e5e5e5] hover:bg-[#1e1e1e] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#666]" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Version list */}
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <p className="text-xs font-medium text-[#666] mb-2">Versions</p>
            <div className="flex flex-wrap gap-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    compareRight === v.id
                      ? "border-[#6366f1] bg-[#6366f1]/10"
                      : "border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#141414]"
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5 text-[#666]" />
                  <div>
                    <p className="text-xs font-semibold text-[#e5e5e5]">
                      V{v.version}
                    </p>
                    <p className="text-[10px] text-[#666]">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectVersion(v.id)}
                    className="p-1 rounded text-[#666] hover:text-[#6366f1] transition-colors"
                    title="View this version"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-side diff */}
          {leftVersion && rightVersion && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666]">Compare:</span>
                  <select
                    value={compareLeft || ""}
                    onChange={(e) => setCompareLeft(e.target.value)}
                    className="bg-[#141414] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#6366f1]/50"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        V{v.version}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-[#666]">vs</span>
                  <select
                    value={compareRight || ""}
                    onChange={(e) => setCompareRight(e.target.value)}
                    className="bg-[#141414] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#6366f1]/50"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        V{v.version}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Left */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#999] mb-2">
                    V{leftVersion.version}
                  </p>
                  {leftVersion.sections.map((sec) => (
                    <div key={sec.id} className="mb-3">
                      <p className="text-xs font-semibold text-[#e5e5e5] mb-1">
                        {sec.title}
                      </p>
                      {sec.rows.map((row, ri) => (
                        <div
                          key={ri}
                          className="text-[11px] text-[#999] border-l-2 border-[#2a2a2a] pl-2 mb-1 leading-relaxed"
                        >
                          {row.col2 || row.col1 || "(empty)"}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Right */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#999] mb-2">
                    V{rightVersion.version}
                  </p>
                  {rightVersion.sections.map((sec) => (
                    <div key={sec.id} className="mb-3">
                      <p className="text-xs font-semibold text-[#e5e5e5] mb-1">
                        {sec.title}
                      </p>
                      {sec.rows.map((row, ri) => (
                        <div
                          key={ri}
                          className="text-[11px] text-[#999] border-l-2 border-[#6366f1]/30 pl-2 mb-1 leading-relaxed"
                        >
                          {row.col2 || row.col1 || "(empty)"}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {versions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#666]">
              <History className="h-10 w-10 mb-3" />
              <p className="text-sm">No version history yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
