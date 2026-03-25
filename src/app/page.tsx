"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ProjectGrid from "@/components/ProjectGrid";
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
  ArrowLeft,
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
  _count?: { scripts: number };
};

type ScriptSummary = {
  id: string;
  name: string;
  version: number;
  updatedAt: string;
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
  const [view, setView] = useState<"projects" | "scripts" | "editor">("projects");

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

  // Initialize - seed if needed, then fetch clients
  useEffect(() => {
    async function init() {
      try {
        await fetch("/api/seed", { method: "POST" });
        const res = await fetch("/api/clients");
        const data = await res.json();
        setClients(data);
        if (data.length > 0 && !activeClientId) {
          setActiveClientId(data[0].id);
        }
        setInitialized(true);
      } catch {
        toast.error("Failed to initialize");
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch projects when client changes
  useEffect(() => {
    if (!activeClientId) return;
    fetch(`/api/projects?clientId=${activeClientId}`)
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects"));
  }, [activeClientId]);

  // Fetch scripts when project changes
  useEffect(() => {
    if (!activeProjectId) return;
    fetch(`/api/scripts?projectId=${activeProjectId}`)
      .then((r) => r.json())
      .then(setScripts)
      .catch(() => toast.error("Failed to load scripts"));
  }, [activeProjectId]);

  const loadScript = useCallback(async (scriptId: string) => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}`);
      const data = await res.json();
      setActiveScript(data);
      setView("editor");
    } catch {
      toast.error("Failed to load script");
    }
  }, []);

  const refreshClients = async () => {
    const res = await fetch("/api/clients");
    setClients(await res.json());
  };

  const handleCreateClient = async () => {
    const name = prompt("Client name:");
    if (!name?.trim()) return;
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const client = await res.json();
      await refreshClients();
      setActiveClientId(client.id);
      toast.success(`Created "${name.trim()}"`);
    } catch {
      toast.error("Failed to create client");
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

  const handleCreateProject = async () => {
    if (!activeClientId) return;
    const name = prompt("Project name:");
    if (!name?.trim()) return;
    const type = prompt("Type (UGC, Static, Concept Test, Hook Test):", "UGC");
    if (type === null) return;
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type: type.trim() || "UGC", clientId: activeClientId }),
      });
      const res = await fetch(`/api/projects?clientId=${activeClientId}`);
      setProjects(await res.json());
      await refreshClients();
      toast.success(`Created "${name.trim()}"`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setView("scripts");
  };

  const handleCreateScript = async () => {
    if (!activeProjectId) return;
    const name = prompt("Script name:");
    if (!name?.trim()) return;
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), projectId: activeProjectId }),
      });
      const script = await res.json();
      const scriptsRes = await fetch(`/api/scripts?projectId=${activeProjectId}`);
      setScripts(await scriptsRes.json());
      loadScript(script.id);
      toast.success(`Created "${name.trim()}"`);
    } catch {
      toast.error("Failed to create script");
    }
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
      const scriptsRes = await fetch(`/api/scripts?projectId=${activeProjectId}`);
      setScripts(await scriptsRes.json());
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

  const toolbarBtnBase =
    "p-2 rounded hover:bg-[#f1f3f4] transition-colors";
  const toolbarBtnInactive =
    `${toolbarBtnBase} text-[#5f6368] hover:text-[#202124]`;
  const toolbarBtnActive =
    `${toolbarBtnBase} text-[#1a73e8] bg-[#e8f0fe]`;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Live Review Bar */}
      {liveReviewActive && (
        <LiveReviewBar isActive={liveReviewActive} onToggle={() => setLiveReviewActive(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        clients={clients}
        activeClientId={activeClientId}
        onSelectClient={(id) => {
          setActiveClientId(id);
          setActiveProjectId(null);
          setActiveScript(null);
          setView("projects");
        }}
        onCreateClient={handleCreateClient}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Google Docs style */}
        <header className="h-12 border-b border-[#dadce0] flex items-center justify-between px-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            {view !== "projects" && (
              <button
                onClick={() => {
                  if (view === "editor") {
                    setActiveScript(null);
                    setView("scripts");
                  } else {
                    setActiveProjectId(null);
                    setView("projects");
                  }
                }}
                className="p-1.5 rounded hover:bg-[#f1f3f4] text-[#5f6368] hover:text-[#202124] transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="text-sm font-medium text-[#202124]">
              {view === "projects" && (clients.find((c) => c.id === activeClientId)?.name || "Select a client")}
              {view === "scripts" && (projects.find((p) => p.id === activeProjectId)?.name || "Project")}
              {view === "editor" && (activeScript?.name || "Script")}
            </h1>
            {view === "editor" && activeScript && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-medium">
                V{activeScript.version}
              </span>
            )}
          </div>

          {/* Action buttons - Google Docs toolbar style */}
          <div className="flex items-center gap-0.5">
            {view === "editor" && activeScript && (
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
              </>
            )}
            {view !== "projects" && activeProjectId && (
              <>
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

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-[#f8f9fa]">
          {view === "projects" && (
            <ProjectGrid
              projects={projects}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
            />
          )}

          {view === "scripts" && (
            <div className="p-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-[#202124]">Scripts</h2>
                <button
                  onClick={handleCreateScript}
                  className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1967d2] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  + New Script
                </button>
              </div>
              {scripts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#5f6368] mb-4">No scripts yet</p>
                  <button
                    onClick={handleCreateScript}
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1967d2] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                  >
                    Create your first script
                  </button>
                  <p className="text-[#80868b] text-sm mt-3">
                    or{" "}
                    <button onClick={() => setTemplatesOpen(true)} className="text-[#1a73e8] hover:text-[#1967d2] hover:underline">
                      use a template
                    </button>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scripts.map((script) => (
                    <button
                      key={script.id}
                      onClick={() => loadScript(script.id)}
                      className="text-left p-4 rounded-lg border border-[#dadce0] hover:border-[#1a73e8] bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm text-[#202124] truncate">{script.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-medium shrink-0 ml-2">
                          V{script.version}
                        </span>
                      </div>
                      <p className="text-xs text-[#80868b]">
                        Updated {new Date(script.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "editor" && activeScript && (
            <ScriptEditor
              script={activeScript}
              onUpdate={() => loadScript(activeScript.id)}
            />
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
