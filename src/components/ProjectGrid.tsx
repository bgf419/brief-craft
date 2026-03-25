"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, FileText, Tag, Clock } from "lucide-react";
import Button from "./Button";

interface Project {
  id: string;
  name: string;
  type: string;
  tags: string;
  isArchived: boolean;
  updatedAt: string;
  _count?: { scripts: number };
}

interface ProjectGridProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
}

const PROJECT_TYPES = ["All", "UGC", "Static", "Concept Test", "Hook Test"];

const typeBadgeColors: Record<string, string> = {
  UGC: "bg-[#6366f1]/20 text-[#818cf8]",
  Static: "bg-[#22c55e]/20 text-[#22c55e]",
  "Concept Test": "bg-[#f59e0b]/20 text-[#f59e0b]",
  "Hook Test": "bg-[#ef4444]/20 text-[#ef4444]",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return then.toLocaleDateString();
}

export default function ProjectGrid({
  projects,
  onSelectProject,
  onCreateProject,
}: ProjectGridProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (p.isArchived) return false;
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [projects, search, typeFilter]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#2a2a2a]">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#141414] border border-[#2a2a2a] rounded-lg p-0.5">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                typeFilter === type
                  ? "bg-[#6366f1] text-white"
                  : "text-[#999] hover:text-[#e5e5e5]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={onCreateProject}
        >
          New Project
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#666]">
            <FileText className="h-10 w-10 mb-3" />
            <p className="text-sm">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project) => {
              const tags = project.tags
                ? project.tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [];
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="text-left bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] hover:bg-[#1e1e1e] transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#e5e5e5] group-hover:text-white truncate pr-2">
                      {project.name}
                    </h3>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        typeBadgeColors[project.type] ||
                        "bg-[#1e1e1e] text-[#999]"
                      }`}
                    >
                      {project.type}
                    </span>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1e1e1e] text-[10px] text-[#999]"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-[10px] text-[#666]">
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#666]">
                    <span>
                      {project._count?.scripts ?? 0} script
                      {(project._count?.scripts ?? 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
