"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, BookTemplate, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Button from "./Button";

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
}

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
  projectId: string;
}

export default function TemplateLibrary({
  isOpen,
  onClose,
  onApply,
  projectId,
}: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchTemplates();
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsCurrent = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        toast.success("Saved as template");
        fetchTemplates();
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (templateId: string) => {
    setApplyingId(templateId);
    try {
      onApply(templateId);
      toast.success("Template applied");
      onClose();
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setApplyingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templates, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Library" size="lg">
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Save className="h-4 w-4" />}
            loading={saving}
            onClick={handleSaveAsCurrent}
          >
            Save Current as Template
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#666]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#666]">
            <BookTemplate className="h-10 w-10 mb-3" />
            <p className="text-sm">No templates found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((template) => (
              <div
                key={template.id}
                className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[#e5e5e5]">
                    {template.name}
                  </h4>
                  {template.type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] font-medium">
                      {template.type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#666] mb-3 line-clamp-2">
                  {template.description}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  loading={applyingId === template.id}
                  onClick={() => handleApply(template.id)}
                  className="w-full"
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
