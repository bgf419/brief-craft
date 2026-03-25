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
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150 group cursor-pointer ${
          isActive
            ? "bg-[#e8f0fe] text-[#1a73e8]"
            : "text-[#202124] hover:bg-[#f1f3f4]"
        }`}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${
            isActive
              ? "bg-[#1a73e8] text-white"
              : "bg-[#e8eaed] text-[#5f6368] group-hover:bg-[#dadce0]"
          }`}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-[13px] font-medium truncate ${
              isActive ? "text-[#1a73e8]" : "text-[#202124]"
            }`}
          >
            {client.name}
          </p>
          <p className={`text-xs ${isActive ? "text-[#1a73e8]/70" : "text-[#5f6368]"}`}>
            {client._count?.projects ?? 0} project
            {(client._count?.projects ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(client.id);
          }}
          className={`p-1 rounded-full transition-colors ${
            client.isFavorite
              ? "text-[#ea8600]"
              : "text-transparent group-hover:text-[#80868b] hover:!text-[#ea8600]"
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
    <aside className="w-64 h-full flex flex-col bg-[#f8f9fa] border-r border-[#dadce0]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#202124]">
            <Building2 className="h-5 w-5 text-[#1a73e8]" />
            <span className="text-sm font-semibold">Clients</span>
          </div>
          <button
            onClick={onCreateClient}
            className="p-1.5 rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed] transition-colors"
            title="New Client"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#80868b]" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#e8eaed] border border-transparent rounded-lg pl-8 pr-3 py-2 text-xs text-[#202124] placeholder-[#80868b] focus:outline-none focus:bg-white focus:border-[#1a73e8] focus:shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {favorites.length > 0 && (
          <>
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#80868b]">
              Favorites
            </p>
            {favorites.map(renderClient)}
          </>
        )}
        {others.length > 0 && (
          <>
            {favorites.length > 0 && (
              <p className="px-3 pt-4 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#80868b]">
                All Clients
              </p>
            )}
            {others.map(renderClient)}
          </>
        )}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-[#80868b]">
            No clients found.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#dadce0]">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-xs text-[#5f6368] hover:text-[#202124] transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      </div>
    </aside>
  );
}
