"use client";

import React, { useState, useMemo } from "react";
import { Star, Plus, Search, Archive, Building2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  isFavorite: boolean;
  isArchived: boolean;
  _count?: { projects: number };
}

interface SidebarProps {
  clients: Client[];
  activeClientId: string | null;
  onSelectClient: (id: string) => void;
  onCreateClient: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function Sidebar({
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
  onToggleFavorite,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (!showArchived && c.isArchived) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [clients, search, showArchived]);

  const favorites = filtered.filter((c) => c.isFavorite);
  const others = filtered.filter((c) => !c.isFavorite);

  const renderClient = (client: Client) => {
    const isActive = client.id === activeClientId;
    return (
      <div
        key={client.id}
        onClick={() => onSelectClient(client.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group cursor-pointer ${
          isActive
            ? "bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#e5e5e5]"
            : "border border-transparent text-[#999] hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
        }`}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
            isActive
              ? "bg-[#6366f1] text-white"
              : "bg-[#1e1e1e] text-[#999] group-hover:bg-[#2a2a2a]"
          }`}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{client.name}</p>
          <p className="text-xs text-[#666]">
            {client._count?.projects ?? 0} project
            {(client._count?.projects ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(client.id);
          }}
          className={`p-1 rounded transition-colors ${
            client.isFavorite
              ? "text-[#f59e0b]"
              : "text-transparent group-hover:text-[#666] hover:!text-[#f59e0b]"
          }`}
        >
          <Star
            className="h-3.5 w-3.5"
            fill={client.isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>
    );
  };

  return (
    <aside className="w-64 h-full flex flex-col bg-[#0a0a0a] border-r border-[#2a2a2a]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#e5e5e5]">
            <Building2 className="h-5 w-5 text-[#6366f1]" />
            <span className="text-sm font-semibold">Clients</span>
          </div>
          <button
            onClick={onCreateClient}
            className="p-1.5 rounded-lg text-[#999] hover:text-[#e5e5e5] hover:bg-[#1e1e1e] transition-colors"
            title="New Client"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#666] focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {favorites.length > 0 && (
          <>
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#666]">
              Favorites
            </p>
            {favorites.map(renderClient)}
          </>
        )}
        {others.length > 0 && (
          <>
            {favorites.length > 0 && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#666]">
                All Clients
              </p>
            )}
            {others.map(renderClient)}
          </>
        )}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-[#666]">
            No clients found.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2a2a2a]">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-xs text-[#666] hover:text-[#999] transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      </div>
    </aside>
  );
}
