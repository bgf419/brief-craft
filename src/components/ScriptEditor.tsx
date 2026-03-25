"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "./Button";

interface Row {
  id: string;
  col1: string;
  col2: string;
  col3: string;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  rows: Row[];
}

interface ScriptWithSections {
  id: string;
  name: string;
  version: number;
  sections: Section[];
}

interface ScriptEditorProps {
  script: ScriptWithSections;
  onUpdate: () => void;
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className={`w-full bg-transparent border border-transparent hover:border-[#2a2a2a] focus:border-[#6366f1]/50 rounded-lg px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#666] resize-none focus:outline-none transition-colors ${className}`}
    />
  );
}

export default function ScriptEditor({ script, onUpdate }: ScriptEditorProps) {
  const [name, setName] = useState(script.name);
  const [sections, setSections] = useState<Section[]>(
    [...script.sections].sort((a, b) => a.order - b.order)
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback(
    async (endpoint: string, body: object) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch(endpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch {
          toast.error("Failed to save changes");
        }
      }, 500);
    },
    []
  );

  const updateScriptName = (newName: string) => {
    setName(newName);
    debouncedSave(`/api/scripts/${script.id}`, { name: newName });
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
    debouncedSave(`/api/sections/${sectionId}`, { title });
  };

  const updateRowCell = (
    sectionId: string,
    rowId: string,
    col: "col1" | "col2" | "col3",
    value: string
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              rows: s.rows.map((r) =>
                r.id === rowId ? { ...r, [col]: value } : r
              ),
            }
          : s
      )
    );
    debouncedSave(`/api/rows/${rowId}`, { [col]: value });
  };

  const addRow = async (sectionId: string) => {
    try {
      const section = sections.find((s) => s.id === sectionId);
      const order = section ? section.rows.length : 0;
      const res = await fetch("/api/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, order }),
      });
      const newRow = await res.json();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, rows: [...s.rows, newRow] } : s
        )
      );
      toast.success("Row added");
    } catch {
      toast.error("Failed to add row");
    }
  };

  const deleteRow = async (sectionId: string, rowId: string) => {
    try {
      await fetch(`/api/rows/${rowId}`, { method: "DELETE" });
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, rows: s.rows.filter((r) => r.id !== rowId) }
            : s
        )
      );
      toast.success("Row deleted");
    } catch {
      toast.error("Failed to delete row");
    }
  };

  const addSection = async () => {
    try {
      const order = sections.length;
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: script.id, title: "New Section", order }),
      });
      const newSection = await res.json();
      setSections((prev) => [...prev, { ...newSection, rows: [] }]);
      toast.success("Section added");
    } catch {
      toast.error("Failed to add section");
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      await fetch(`/api/sections/${sectionId}`, { method: "DELETE" });
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await fetch(`/api/scripts/${script.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sections }),
      });
      toast.success("Saved successfully");
      onUpdate();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleCollapse = (sectionId: string) => {
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => updateScriptName(e.target.value)}
            className="bg-transparent text-lg font-semibold text-[#e5e5e5] border-b border-transparent hover:border-[#2a2a2a] focus:border-[#6366f1] focus:outline-none transition-colors px-1 py-0.5"
          />
          <span className="px-2.5 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] text-xs font-semibold">
            V{script.version}
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Save className="h-4 w-4" />}
          loading={saving}
          onClick={saveAll}
        >
          Save
        </Button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-0 px-6 py-2 border-b border-[#2a2a2a] bg-[#141414]">
        <div />
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[#666]">
          Visual / Direction
        </div>
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[#666]">
          Script / Copy
        </div>
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[#666]">
          Notes / Assets
        </div>
        <div />
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.id];
          const sortedRows = [...section.rows].sort(
            (a, b) => a.order - b.order
          );
          return (
            <div
              key={section.id}
              className="border-b border-[#2a2a2a]"
            >
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] border-b border-[#2a2a2a] group">
                <GripVertical className="h-4 w-4 text-[#666] cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => toggleCollapse(section.id)}
                  className="p-0.5 rounded text-[#666] hover:text-[#e5e5e5] transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(section.id, e.target.value)
                  }
                  className="flex-1 bg-transparent text-sm font-semibold text-[#e5e5e5] border-b border-transparent hover:border-[#2a2a2a] focus:border-[#6366f1] focus:outline-none px-1 py-0.5 transition-colors"
                />
                <button
                  onClick={() => deleteSection(section.id)}
                  className="p-1 rounded text-[#666] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Rows */}
              {!isCollapsed && (
                <div>
                  {sortedRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-0 border-b border-[#1e1e1e] group/row hover:bg-[#141414]/50 transition-colors"
                    >
                      <div className="flex items-start justify-center pt-3">
                        <GripVertical className="h-4 w-4 text-[#666] cursor-grab opacity-0 group-hover/row:opacity-100 transition-opacity" />
                      </div>
                      <div className="border-r border-[#1e1e1e] py-1">
                        <AutoResizeTextarea
                          value={row.col1}
                          onChange={(val) =>
                            updateRowCell(section.id, row.id, "col1", val)
                          }
                          placeholder="Visual direction..."
                        />
                      </div>
                      <div className="border-r border-[#1e1e1e] py-1">
                        <AutoResizeTextarea
                          value={row.col2}
                          onChange={(val) =>
                            updateRowCell(section.id, row.id, "col2", val)
                          }
                          placeholder="Script / copy..."
                        />
                      </div>
                      <div className="py-1">
                        <AutoResizeTextarea
                          value={row.col3}
                          onChange={(val) =>
                            updateRowCell(section.id, row.id, "col3", val)
                          }
                          placeholder="Notes / assets..."
                        />
                      </div>
                      <div className="flex items-start justify-center pt-3">
                        <button
                          onClick={() => deleteRow(section.id, row.id)}
                          className="p-1 rounded text-[#666] hover:text-[#ef4444] opacity-0 group-hover/row:opacity-100 transition-all"
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add row */}
                  <button
                    onClick={() => addRow(section.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-[#666] hover:text-[#6366f1] hover:bg-[#141414] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Row
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add section */}
        <button
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 py-4 text-sm text-[#666] hover:text-[#6366f1] hover:bg-[#141414] border-b border-[#2a2a2a] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>
    </div>
  );
}
