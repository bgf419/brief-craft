"use client";

import React, { useState } from "react";
import { Sparkles, Copy, ArrowDownToLine, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Button from "./Button";

interface AIGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

type TabKey = "headlines" | "hooks" | "offers" | "ctas";

const TABS: { key: TabKey; label: string }[] = [
  { key: "headlines", label: "Headlines" },
  { key: "hooks", label: "Hooks" },
  { key: "offers", label: "Offers" },
  { key: "ctas", label: "CTAs" },
];

export default function AIGenerator({
  isOpen,
  onClose,
  onInsert,
}: AIGeneratorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("headlines");
  const [context, setContext] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("Please describe your product or offer");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, context: context.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        if ((data.results || []).length === 0) {
          toast("No results generated. Try rephrasing your input.");
        }
      } else {
        toast.error("Generation failed");
      }
    } catch {
      toast.error("Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleInsert = (text: string) => {
    onInsert(text);
    toast.success("Inserted into script");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Content Generator" size="lg">
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setResults([]);
              }}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#6366f1] text-white"
                  : "text-[#999] hover:text-[#e5e5e5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Context input */}
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">
            Describe your product or offer
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., A premium skincare brand targeting women 25-45 who want anti-aging results..."
            rows={4}
            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#666] resize-none focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>

        {/* Generate button */}
        <Button
          variant="primary"
          size="md"
          icon={<Sparkles className="h-4 w-4" />}
          loading={loading}
          onClick={handleGenerate}
          className="w-full"
        >
          {loading ? "Generating..." : `Generate ${TABS.find((t) => t.key === activeTab)?.label}`}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#999]">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-colors group"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6366f1]/15 flex items-center justify-center text-[10px] font-bold text-[#818cf8]">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm text-[#e5e5e5] leading-relaxed">
                  {result}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyToClipboard(result)}
                    className="p-1.5 rounded-md text-[#666] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleInsert(result)}
                    className="p-1.5 rounded-md text-[#666] hover:text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
                    title="Insert into script"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-[#666]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Generating content...</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
