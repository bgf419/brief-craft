"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ScriptEditor from "@/components/ScriptEditor";
import CommentPanel from "@/components/CommentPanel";
import TemplateLibrary from "@/components/TemplateLibrary";
import AIGenerator from "@/components/AIGenerator";
import VersionHistory from "@/components/VersionHistory";
import ExportMenu from "@/components/ExportMenu";
import ShareDialog from "@/components/ShareDialog";
import ABTestPanel from "@/components/ABTestPanel";
import MediaPanel from "@/components/MediaPanel";
import LiveReviewBar from "@/components/LiveReviewBar";
import toast from "react-hot-toast";
import {
  MessageSquare,
  LayoutTemplate,
  Sparkles,
  History,
  Share2,
  FlaskConical,
  ImageIcon,
  Presentation,
  ChevronDown,
  Plus,
  FileText,
  Search,
  FolderOpen,
  Star,
  MoreHorizontal,
  Trash2,
  Check,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  isFavorite: boolean;
  isArchived: boolean;
  _count?: { projects: number };
};

type Project = {
  id: string;
  name: string;
  type: string;
  tags: string;
  isArchived: boolean;
  updatedAt: string;
  clientId: string;
  _count?: { scripts: number };
};

type ScriptSummary = {
  id: string;
  name: string;
  version: number;
  updatedAt: string;
  projectId: string;
};

type ScriptFull = {
  id: string;
  name: string;
  version: number;
  projectId: string;
  parentId: string | null;
  sections: {
    id: string;
    title: string;
    order: number;
    rows: {
      id: string;
      col1: string;
      col2: string;
      col3: string;
      order: number;
    }[];
  }[];
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [activeScript, setActiveScript] = useState<ScriptFull | null>(null);

  // Sidebar state
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [showNewScriptInput, setShowNewScriptInput] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ type: string; id: string; x: number; y: number } | null>(null);
  const [newScriptProjectId, setNewScriptProjectId] = useState<string | null>(null);

  // Panel states
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [abTestOpen, setAbTestOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [liveReviewActive, setLiveReviewActive] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const newClientInputRef = useRef<HTMLInputElement>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const newScriptInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  // Focus inputs when shown
  useEffect(() => { if (showNewClientInput) newClientInputRef.current?.focus(); }, [showNewClientInput]);
  useEffect(() => { if (showNewProjectInput) newProjectInputRef.current?.focus(); }, [showNewProjectInput]);
  useEffect(() => { if (showNewScriptInput) newScriptInputRef.current?.focus(); }, [showNewScriptInput]);

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/seed", { method: "POST" });
        const res = await fetch("/api/clients");
        const data = await res.json();
        setClients(data);
        if (data.length > 0) {
          setActiveClientId(data[0].id);
        }
        setInitialized(true);
      } catch {
        toast.error("Failed to initialize");
      }
    }
    init();
  }, []);

  // Fetch projects when client changes
  useEffect(() => {
    if (!activeClientId) return;
    fetch(`/api/projects?clientId=${activeClientId}`)
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        // Auto-expand all projects that have scripts
        const expanded: Record<string, boolean> = {};
        data.forEach((p: Project) => { expanded[p.id] = true; });
        setExpandedProjects(expanded);
      })
      .catch(() => toast.error("Failed to load projects"));
  }, [activeClientId]);

  // Fetch all scripts for all projects of the client
  useEffect(() => {
    if (projects.length === 0) {
      setScripts([]);
      return;
    }
    // Fetch scripts for each project
    Promise.all(
      projects.map((p) =>
        fetch(`/api/scripts?projectId=${p.id}`)
          .then((r) => r.json())
          .then((scripts: ScriptSummary[]) => scripts.map((s) => ({ ...s, projectId: p.id })))
      )
    )
      .then((results) => setScripts(results.flat()))
      .catch(() => toast.error("Failed to load scripts"));
  }, [projects]);

  const loadScript = useCallback(async (scriptId: string) => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}`);
      const data = await res.json();
      setActiveScript(data);
      setActiveProjectId(data.projectId);
    } catch {
      toast.error("Failed to load script");
    }
  }, []);

  const refreshClients = async () => {
    const res = await fetch("/api/clients");
    setClients(await res.json());
  };

  const refreshProjects = async () => {
    if (!activeClientId) return;
    const res = await fetch(`/api/projects?clientId=${activeClientId}`);
    const data = await res.json();
    setProjects(data);
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName.trim() }),
      });
      const client = await res.json();
      await refreshClients();
      setActiveClientId(client.id);
      setNewClientName("");
      setShowNewClientInput(false);
      setClientDropdownOpen(false);
      toast.success(`Created "${newClientName.trim()}"`);
    } catch {
      toast.error("Failed to create client");
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !activeClientId) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim(), type: "UGC", clientId: activeClientId }),
      });
      const project = await res.json();
      await refreshProjects();
      setExpandedProjects((prev) => ({ ...prev, [project.id]: true }));
      setNewProjectName("");
      setShowNewProjectInput(false);
      toast.success(`Created "${newProjectName.trim()}"`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleCreateScript = async (projectId: string) => {
    if (!newScriptName.trim()) return;
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newScriptName.trim(), projectId }),
      });
      const script = await res.json();
      // Refresh scripts
      const scriptsRes = await fetch(`/api/scripts?projectId=${projectId}`);
      const newScripts = (await scriptsRes.json()).map((s: ScriptSummary) => ({ ...s, projectId }));
      setScripts((prev) => [...prev.filter((s) => s.projectId !== projectId), ...newScripts]);
      setNewScriptName("");
      setShowNewScriptInput(false);
      setNewScriptProjectId(null);
      loadScript(script.id);
      toast.success(`Created "${newScriptName.trim()}"`);
    } catch {
      toast.error("Failed to create script");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !client.isFavorite }),
    });
    await refreshClients();
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/templates/${templateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId }),
      });
      const script = await res.json();
      await refreshProjects();
      loadScript(script.id);
      setTemplatesOpen(false);
      toast.success("Template applied!");
    } catch {
      toast.error("Failed to apply template");
    }
  };

  const handleInsertAI = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard - paste into any field");
    setAiGenOpen(false);
  };

  const activeClient = clients.find((c) => c.id === activeClientId);

  // Filter sidebar items by search
  const filteredProjects = projects.filter((p) => {
    if (!sidebarSearch) return !p.isArchived;
    const q = sidebarSearch.toLowerCase();
    const projectMatch = p.name.toLowerCase().includes(q);
    const scriptMatch = scripts.some((s) => s.projectId === p.id && s.name.toLowerCase().includes(q));
    return !p.isArchived && (projectMatch || scriptMatch);
  });

  const getProjectScripts = (projectId: string) => {
    return scripts
      .filter((s) => s.projectId === projectId)
      .filter((s) => !sidebarSearch || s.name.toLowerCase().includes(sidebarSearch.toLowerCase()));
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5f6368]">Loading BriefCraft...</p>
        </div>
      </div>
    );
  }

  const toolbarBtnBase = "p-2 rounded hover:bg-[#f1f3f4] transition-colors";
  const toolbarBtnInactive = `${toolbarBtnBase} text-[#5f6368] hover:text-[#202124]`;
  const toolbarBtnActive = `${toolbarBtnBase} text-[#1a73e8] bg-[#e8f0fe]`;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Live Review Bar */}
      {liveReviewActive && (
        <LiveReviewBar isActive={liveReviewActive} onToggle={() => setLiveReviewActive(false)} />
      )}

      {/* LEFT SIDEBAR — Briefs & Scripts */}
      <aside className="w-64 h-full flex flex-col bg-[#f8f9fa] border-r border-[#dadce0] shrink-0">
        {/* Client Dropdown */}
        <div className="px-3 pt-3 pb-2" ref={clientDropdownRef}>
          <button
            onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#dadce0] hover:border-[#1a73e8] transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {activeClient?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="text-sm font-medium text-[#202124] truncate">
                {activeClient?.name || "Select client"}
              </span>
            </div>
            <ChevronDown size={16} className={`text-[#5f6368] transition-transform ${clientDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {clientDropdownOpen && (
            <div className="absolute z-50 mt-1 w-56 bg-white border border-[#dadce0] rounded-lg shadow-lg py-1 animate-fade-in">
              {clients.filter((c) => !c.isArchived).map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setActiveClientId(client.id);
                    setActiveProjectId(null);
                    setActiveScript(null);
                    setClientDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f1f3f4] transition-colors ${
                    client.id === activeClientId ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#202124]"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    client.id === activeClientId ? "bg-[#1a73e8] text-white" : "bg-[#e8eaed] text-[#5f6368]"
                  }`}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate flex-1">{client.name}</span>
                  {client.isFavorite && <Star size={12} className="text-[#ea8600] fill-current" />}
                  {client.id === activeClientId && <Check size={14} className="text-[#1a73e8]" />}
                </button>
              ))}
              <div className="border-t border-[#dadce0] my-1" />
              {showNewClientInput ? (
                <div className="px-3 py-2">
                  <input
                    ref={newClientInputRef}
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateClient();
                      if (e.key === "Escape") { setShowNewClientInput(false); setNewClientName(""); }
                    }}
                    placeholder="Client name..."
                    className="w-full px-2 py-1.5 text-sm border border-[#1a73e8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowNewClientInput(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors"
                >
                  <Plus size={14} />
                  New client
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#80868b]" />
            <input
              type="text"
              placeholder="Search briefs..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-white border border-[#dadce0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]/30 transition-colors"
            />
          </div>
        </div>

        {/* Project / Script Tree */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredProjects.length === 0 && !showNewProjectInput ? (
            <div className="text-center py-10 px-4">
              <FolderOpen className="h-8 w-8 text-[#dadce0] mx-auto mb-2" />
              <p className="text-xs text-[#80868b]">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredProjects.map((project) => {
                const projectScripts = getProjectScripts(project.id);
                const isExpanded = expandedProjects[project.id];
                return (
                  <div key={project.id}>
                    {/* Project header */}
                    <div
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
                        activeProjectId === project.id && !activeScript ? "bg-[#e8f0fe]" : "hover:bg-white"
                      }`}
                      onClick={() => {
                        setExpandedProjects((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
                      }}
                    >
                      <ChevronDown
                        size={14}
                        className={`text-[#80868b] shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                      <FolderOpen size={14} className="text-[#80868b] shrink-0" />
                      <span className="text-[13px] font-medium text-[#202124] truncate flex-1">{project.name}</span>
                      <span className="text-[10px] text-[#80868b] opacity-0 group-hover:opacity-100 transition-opacity">
                        {projectScripts.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewScriptProjectId(project.id);
                          setShowNewScriptInput(true);
                          setExpandedProjects((prev) => ({ ...prev, [project.id]: true }));
                        }}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#e8f0fe] text-[#5f6368] hover:text-[#1a73e8] transition-all"
                        title="New script"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Scripts under project */}
                    {isExpanded && (
                      <div className="ml-4">
                        {projectScripts.map((script) => (
                          <button
                            key={script.id}
                            onClick={() => {
                              setActiveProjectId(project.id);
                              loadScript(script.id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group/script ${
                              activeScript?.id === script.id
                                ? "bg-[#e8f0fe] text-[#1a73e8]"
                                : "text-[#202124] hover:bg-white"
                            }`}
                          >
                            <FileText size={13} className={activeScript?.id === script.id ? "text-[#1a73e8]" : "text-[#80868b]"} />
                            <span className="text-[13px] truncate flex-1">{script.name}</span>
                            <span className={`text-[10px] ${activeScript?.id === script.id ? "text-[#1a73e8]" : "text-[#80868b]"}`}>
                              v{script.version}
                            </span>
                          </button>
                        ))}

                        {/* Inline new script input */}
                        {showNewScriptInput && newScriptProjectId === project.id && (
                          <div className="flex items-center gap-1 px-2 py-1">
                            <FileText size={13} className="text-[#1a73e8] shrink-0" />
                            <input
                              ref={newScriptInputRef}
                              type="text"
                              value={newScriptName}
                              onChange={(e) => setNewScriptName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateScript(project.id);
                                if (e.key === "Escape") { setShowNewScriptInput(false); setNewScriptName(""); setNewScriptProjectId(null); }
                              }}
                              onBlur={() => {
                                if (!newScriptName.trim()) { setShowNewScriptInput(false); setNewScriptProjectId(null); }
                              }}
                              placeholder="Script name..."
                              className="flex-1 text-[13px] px-1.5 py-0.5 border border-[#1a73e8] rounded focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
                            />
                          </div>
                        )}

                        {projectScripts.length === 0 && !(showNewScriptInput && newScriptProjectId === project.id) && (
                          <p className="text-[11px] text-[#80868b] px-2 py-2 italic">No scripts</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New project input */}
          {showNewProjectInput ? (
            <div className="flex items-center gap-1 px-2 py-1.5 mt-1">
              <FolderOpen size={14} className="text-[#1a73e8] shrink-0" />
              <input
                ref={newProjectInputRef}
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProject();
                  if (e.key === "Escape") { setShowNewProjectInput(false); setNewProjectName(""); }
                }}
                onBlur={() => {
                  if (!newProjectName.trim()) { setShowNewProjectInput(false); }
                }}
                placeholder="Project name..."
                className="flex-1 text-[13px] px-1.5 py-0.5 border border-[#1a73e8] rounded focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowNewProjectInput(true)}
              className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-md text-[13px] text-[#5f6368] hover:bg-white hover:text-[#1a73e8] transition-colors"
            >
              <Plus size={14} />
              New project
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 border-b border-[#dadce0] flex items-center justify-between px-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-[#202124]">
              {activeScript?.name || "Select a brief to start editing"}
            </h1>
            {activeScript && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-medium">
                V{activeScript.version}
              </span>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-0.5">
            {activeScript && (
              <>
                <button
                  onClick={() => setCommentsOpen(!commentsOpen)}
                  className={commentsOpen ? toolbarBtnActive : toolbarBtnInactive}
                  title="Comments"
                >
                  <MessageSquare size={18} />
                </button>
                <button
                  onClick={() => setMediaOpen(!mediaOpen)}
                  className={mediaOpen ? toolbarBtnActive : toolbarBtnInactive}
                  title="Media"
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  onClick={() => setAiGenOpen(true)}
                  className={toolbarBtnInactive}
                  title="AI Generator"
                >
                  <Sparkles size={18} />
                </button>
                <button
                  onClick={() => setVersionsOpen(true)}
                  className={toolbarBtnInactive}
                  title="Version History"
                >
                  <History size={18} />
                </button>
                <ExportMenu scriptId={activeScript.id} />
                <div className="w-px h-5 bg-[#dadce0] mx-1" />
                <button
                  onClick={() => setLiveReviewActive(!liveReviewActive)}
                  className={liveReviewActive ? toolbarBtnActive : toolbarBtnInactive}
                  title="Live Review Mode"
                >
                  <Presentation size={18} />
                </button>
                <button
                  onClick={() => setTemplatesOpen(true)}
                  className={toolbarBtnInactive}
                  title="Templates"
                >
                  <LayoutTemplate size={18} />
                </button>
                <button
                  onClick={() => setShareOpen(true)}
                  className={toolbarBtnInactive}
                  title="Share"
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => setAbTestOpen(true)}
                  className={toolbarBtnInactive}
                  title="A/B Tests"
                >
                  <FlaskConical size={18} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Editor Area */}
        <main className="flex-1 overflow-auto bg-[#f8f9fa]">
          {activeScript ? (
            <ScriptEditor
              script={activeScript}
              onUpdate={() => loadScript(activeScript.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-[#dadce0] mx-auto mb-4" />
                <h2 className="text-lg font-medium text-[#202124] mb-2">No brief selected</h2>
                <p className="text-sm text-[#5f6368] mb-6 max-w-sm">
                  Select a brief from the sidebar to start editing, or create a new one.
                </p>
                {projects.length > 0 && (
                  <button
                    onClick={() => {
                      const firstProject = projects[0];
                      if (firstProject) {
                        setNewScriptProjectId(firstProject.id);
                        setShowNewScriptInput(true);
                        setExpandedProjects((prev) => ({ ...prev, [firstProject.id]: true }));
                      }
                    }}
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1967d2] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                  >
                    Create a new brief
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Right Panels */}
      {commentsOpen && activeScript && (
        <CommentPanel
          scriptId={activeScript.id}
          isOpen={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      )}

      {mediaOpen && (
        <MediaPanel isOpen={mediaOpen} onClose={() => setMediaOpen(false)} />
      )}

      {/* Modals */}
      {templatesOpen && activeProjectId && (
        <TemplateLibrary
          isOpen={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          onApply={handleApplyTemplate}
          projectId={activeProjectId}
        />
      )}

      {aiGenOpen && (
        <AIGenerator
          isOpen={aiGenOpen}
          onClose={() => setAiGenOpen(false)}
          onInsert={handleInsertAI}
        />
      )}

      {versionsOpen && activeScript && (
        <VersionHistory
          scriptId={activeScript.id}
          isOpen={versionsOpen}
          onClose={() => setVersionsOpen(false)}
          onSelectVersion={(id) => {
            loadScript(id);
            setVersionsOpen(false);
          }}
        />
      )}

      {shareOpen && activeProjectId && (
        <ShareDialog
          projectId={activeProjectId}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      {abTestOpen && activeProjectId && (
        <ABTestPanel
          projectId={activeProjectId}
          scripts={scripts}
          isOpen={abTestOpen}
          onClose={() => setAbTestOpen(false)}
        />
      )}
    </div>
  );
}
