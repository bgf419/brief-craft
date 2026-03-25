"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Upload,
  FlaskConical,
  BarChart3,
  Loader2,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "./Button";

interface Script {
  id: string;
  name: string;
  version: number;
}

interface TestMetrics {
  roas?: number;
  ctr?: number;
  cvr?: number;
}

interface ABTest {
  id: string;
  name: string;
  platform: string;
  status: "draft" | "running" | "completed";
  scriptAId: string;
  scriptBId: string;
  scriptAName?: string;
  scriptBName?: string;
  metrics: TestMetrics;
  createdAt: string;
}

interface ABTestPanelProps {
  projectId: string;
  scripts: Script[];
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f1f3f4] text-[#5f6368]",
  running: "bg-[#fef7e0] text-[#e8710a]",
  completed: "bg-[#e6f4ea] text-[#137333]",
};

export default function ABTestPanel({
  projectId,
  scripts,
  isOpen,
  onClose,
}: ABTestPanelProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState("Meta");
  const [formScriptA, setFormScriptA] = useState("");
  const [formScriptB, setFormScriptB] = useState("");
  const [creating, setCreating] = useState(false);

  // Metrics edit state
  const [editRoas, setEditRoas] = useState("");
  const [editCtr, setEditCtr] = useState("");
  const [editCvr, setEditCvr] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetchTests();
  }, [isOpen, projectId]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/abtests?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formScriptA || !formScriptB) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/abtests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: formName.trim(),
          platform: formPlatform,
          scriptAId: formScriptA,
          scriptBId: formScriptB,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTests((prev) => [...prev, data]);
        setShowForm(false);
        setFormName("");
        toast.success("A/B test created");
      }
    } catch {
      toast.error("Failed to create test");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveMetrics = async (testId: string) => {
    try {
      await fetch(`/api/abtests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            roas: editRoas ? parseFloat(editRoas) : undefined,
            ctr: editCtr ? parseFloat(editCtr) : undefined,
            cvr: editCvr ? parseFloat(editCvr) : undefined,
          },
        }),
      });
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                metrics: {
                  roas: editRoas ? parseFloat(editRoas) : t.metrics.roas,
                  ctr: editCtr ? parseFloat(editCtr) : t.metrics.ctr,
                  cvr: editCvr ? parseFloat(editCvr) : t.metrics.cvr,
                },
              }
            : t
        )
      );
      setEditingMetrics(null);
      toast.success("Metrics updated");
    } catch {
      toast.error("Failed to save metrics");
    }
  };

  const handleCSVUpload = async (testId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("testId", testId);
      try {
        const res = await fetch("/api/abtests/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          toast.success("CSV uploaded successfully");
          fetchTests();
        }
      } catch {
        toast.error("Failed to upload CSV");
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[520px] bg-white border-l border-[#dadce0] z-40 flex flex-col shadow-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0]">
        <h3 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[#1a73e8]" />
          A/B Tests
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowForm(!showForm)}
          >
            New Test
          </Button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#80868b] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Create form */}
        {showForm && (
          <div className="p-5 border-b border-[#dadce0] space-y-3">
            <input
              type="text"
              placeholder="Test name..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#5f6368] mb-1">
                  Script A
                </label>
                <select
                  value={formScriptA}
                  onChange={(e) => setFormScriptA(e.target.value)}
                  className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                >
                  <option value="">Select...</option>
                  {scripts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (V{s.version})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5f6368] mb-1">
                  Script B
                </label>
                <select
                  value={formScriptB}
                  onChange={(e) => setFormScriptB(e.target.value)}
                  className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                >
                  <option value="">Select...</option>
                  {scripts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (V{s.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#5f6368] mb-1">
                Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full bg-white border border-[#dadce0] rounded-lg px-3 py-2 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8]"
              >
                <option>Meta</option>
                <option>Google</option>
                <option>TikTok</option>
                <option>YouTube</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                loading={creating}
                onClick={handleCreate}
                className="flex-1"
              >
                Create Test
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tests list */}
        <div className="p-5 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#80868b]" />
            </div>
          )}
          {!loading && tests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#80868b]">
              <FlaskConical className="h-10 w-10 mb-3" />
              <p className="text-sm">No A/B tests yet.</p>
            </div>
          )}
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white border border-[#dadce0] rounded-xl p-4 hover:border-[#80868b] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#202124]">
                    {test.name}
                  </h4>
                  <p className="text-xs text-[#5f6368] mt-0.5">
                    {test.platform}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                    STATUS_COLORS[test.status] || STATUS_COLORS.draft
                  }`}
                >
                  {test.status}
                </span>
              </div>

              {/* Metrics */}
              {editingMetrics === test.id ? (
                <div className="space-y-2 mb-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#5f6368] mb-0.5">
                        ROAS
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editRoas}
                        onChange={(e) => setEditRoas(e.target.value)}
                        className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded px-2 py-1 text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#5f6368] mb-0.5">
                        CTR %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCtr}
                        onChange={(e) => setEditCtr(e.target.value)}
                        className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded px-2 py-1 text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#5f6368] mb-0.5">
                        CVR %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCvr}
                        onChange={(e) => setEditCvr(e.target.value)}
                        className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded px-2 py-1 text-xs text-[#202124] focus:outline-none focus:border-[#1a73e8]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveMetrics(test.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingMetrics(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[#5f6368] mb-0.5">ROAS</p>
                    <p className="text-sm font-bold text-[#1a73e8]">
                      {test.metrics.roas != null
                        ? `${test.metrics.roas}x`
                        : "--"}
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[#5f6368] mb-0.5">CTR</p>
                    <p className="text-sm font-bold text-[#137333]">
                      {test.metrics.ctr != null
                        ? `${test.metrics.ctr}%`
                        : "--"}
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[#5f6368] mb-0.5">CVR</p>
                    <p className="text-sm font-bold text-[#e8710a]">
                      {test.metrics.cvr != null
                        ? `${test.metrics.cvr}%`
                        : "--"}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingMetrics(test.id);
                    setEditRoas(test.metrics.roas?.toString() || "");
                    setEditCtr(test.metrics.ctr?.toString() || "");
                    setEditCvr(test.metrics.cvr?.toString() || "");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit Metrics
                </button>
                <button
                  onClick={() => handleCSVUpload(test.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  Upload CSV
                </button>
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors ml-auto"
                >
                  <BarChart3 className="h-3 w-3" />
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
