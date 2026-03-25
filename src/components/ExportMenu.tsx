"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Globe,
  Hash,
  ChevronDown,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface ExportMenuProps {
  scriptId: string;
}

type ExportFormat = "pdf" | "docx" | "csv" | "html" | "slack";

const EXPORT_OPTIONS: {
  format: ExportFormat;
  label: string;
  icon: React.ReactNode;
}[] = [
  { format: "pdf", label: "PDF Document", icon: <FileText className="h-4 w-4" /> },
  { format: "docx", label: "Word (.docx)", icon: <FileText className="h-4 w-4" /> },
  { format: "csv", label: "CSV Spreadsheet", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { format: "html", label: "HTML Page", icon: <Globe className="h-4 w-4" /> },
  { format: "slack", label: "Slack-ready", icon: <Hash className="h-4 w-4" /> },
];

export default function ExportMenu({ scriptId }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const res = await fetch(`/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId, format }),
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      if (format === "slack") {
        const data = await res.json();
        await navigator.clipboard.writeText(data.text);
        toast.success("Copied Slack-ready text to clipboard");
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `script.${format === "docx" ? "docx" : format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
      }

      setIsOpen(false);
    } catch {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] text-sm text-[#999] hover:text-[#e5e5e5] hover:border-[#3a3a3a] hover:bg-[#1e1e1e] transition-all"
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-1">
            {EXPORT_OPTIONS.map(({ format, label, icon }) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={exporting !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#999] hover:text-[#e5e5e5] hover:bg-[#1e1e1e] transition-colors disabled:opacity-50"
              >
                {exporting === format ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  icon
                )}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
