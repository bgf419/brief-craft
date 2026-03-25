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

const typeBadgeColors: Record<string, { bg: string; text: string }> = {
  UGC: { bg: "bg-[#e8f0fe]", text: "text-[#1a73e8]" },
  Static: { bg: "bg-[#e6f4ea]", text: "text-[#188038]" },
  "Concept Test": { bg: "bg-[#fef7e0]", text: "text-[#ea8600]" },
  "Hook Test": { bg: "bg-[#fce8e6]", text: "text-[#d93025]" },
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
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa]">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#dadce0] bg-white">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#80868b]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#f1f3f4] border border-[#dadce0] rounded-lg pl-9 pr-3 py-2 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:bg-white focus:ring-1 focus:ring-[#1a73e8] transition-colors"
          />
        </div>

        <div className="flex items-center gap-0.5 bg-[#f1f3f4] border border-[#dadce0] rounded-lg p-0.5">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                typeFilter === type
                  ? "bg-[#1a73e8] text-white shadow-sm"
                  : "text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed]"
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
          <div className="flex flex-col items-center justify-center h-48 text-[#80868b]">
            <div className="w-16 h-16 mb-4 rounded-full bg-[#f1f3f4] flex items-center justify-center">
              <FileText className="h-8 w-8 text-[#dadce0]" />
            </div>
            <p className="text-sm font-medium text-[#5f6368]">No projects found</p>
            <p className="text-xs text-[#80868b] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project) => {
              let tags: string[] = [];
              try {
                tags = JSON.parse(project.tags || "[]");
              } catch {
                tags = project.tags ? project.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
              }
              const badge = typeBadgeColors[project.type];
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="text-left bg-white border border-[#dadce0] rounded-xl p-4 hover:shadow-md hover:border-[#1a73e8]/30 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#202124] group-hover:text-[#1a73e8] truncate pr-2">
                      {project.name}
                    </h3>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        badge
                          ? `${badge.bg} ${badge.text}`
                          : "bg-[#f1f3f4] text-[#5f6368]"
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f1f3f4] text-[10px] text-[#5f6368]"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-[10px] text-[#80868b]">
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#80868b]">
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
