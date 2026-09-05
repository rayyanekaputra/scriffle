'use client';

import React, { useState, useEffect } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';

interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
}

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCanvasId?: string;
  onSwitchCanvas?: (newCanvasId: string) => void;
  onExportScriffle?: () => void;
}

export const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentCanvasId,
  onSwitchCanvas,
  onExportScriffle,
}) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/canvas/list');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load project list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleCreateNewProject = async (inNewTab = false) => {
    const newId = crypto.randomUUID();
    const targetUrl = `/b/${newId}`;

    if (inNewTab) {
      window.open(targetUrl, '_blank');
      try {
        await fetch(`/api/canvas?id=${newId}`);
        await fetchProjects();
      } catch (err) {
        console.error('Failed to create new project:', err);
      }
    } else {
      if (onSwitchCanvas) {
        onSwitchCanvas(newId);
        try {
          await fetch(`/api/canvas?id=${newId}`);
          await fetchProjects();
        } catch (err) {
          console.error('Failed to create new project:', err);
        }
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const handleSelectProject = (projectId: string, inNewTab = false) => {
    const targetUrl = `/b/${projectId}`;
    if (inNewTab) {
      window.open(targetUrl, '_blank');
    } else {
      if (onSwitchCanvas) {
        onSwitchCanvas(projectId);
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectId === currentCanvasId) return;
    if (!confirm(`Are you sure you want to delete board "${projectName}"? This action cannot be undone.`)) return;

    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/canvas?id=${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      console.error('Failed to delete canvas:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-slate-300 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <MingIcon name="folder_line" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Project Hub & Switcher</h2>
              <p className="text-xs text-slate-500">Manage multiple concurrent whiteboard projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
            title="Close Project Hub (Esc)"
          >
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Quick New Project Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-5 py-3 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MingIcon name="information_line" size={14} className="text-indigo-500 shrink-0" />
            <span>1 Browser Tab = 1 Project. Open boards side-by-side.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCreateNewProject(true)}
              title="Open fresh blank board in a new browser tab"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            >
              <MingIcon name="add_line" size={14} />
              <span>New Tab</span>
            </button>
            <button
              onClick={() => handleCreateNewProject(false)}
              title="Create new board in current window"
              className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <MingIcon name="add_line" size={14} className="text-slate-500" />
              <span>This Tab</span>
            </button>
          </div>
        </div>

        {/* Saved Projects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <MingIcon name="loading_line" size={16} className="animate-spin text-indigo-500" />
              <span>Loading saved projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No saved projects found in database.
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = proj.id === currentCanvasId;
              const isDeleting = deletingId === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id, false)}
                  className={`group flex items-center justify-between rounded-xl p-3 pt-3 transition cursor-pointer border ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-slate-600 border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      <MingIcon name={isCurrent ? 'board_fill' : 'board_line'} size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {proj.name || 'untitled board'}
                        </span>
                        {isCurrent && (
                          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span>{proj.nodeCount} card{proj.nodeCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{proj.edgeCount} link{proj.edgeCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(proj.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProject(proj.id, true);
                      }}
                      title="Open in new browser tab"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
                    >
                      <MingIcon name="external_link_line" size={15} />
                    </button>

                    {!isCurrent && (
                      <button
                        onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                        disabled={isDeleting}
                        title="Delete this project"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        <MingIcon name="delete_2_line" size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Backup Safeguard */}
        <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-5 py-3">
          <div className="text-[11px] text-slate-500">
            Boards auto-save continuously to SQLite.
          </div>
          {onExportScriffle && (
            <button
              onClick={() => onExportScriffle()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer"
            >
              <MingIcon name="download_line" size={14} />
              <span>Save .scriffle Backup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
