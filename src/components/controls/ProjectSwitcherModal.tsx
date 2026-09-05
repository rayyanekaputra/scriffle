'use client';

import React, { useState, useEffect } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme } = useTheme();
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
    if (!confirm(`Are you sure you want to delete project "${projectName || 'untitled board'}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/canvas?id=${projectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (projectId === currentCanvasId) {
          window.location.href = '/';
        } else {
          await fetchProjects();
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const modalBg = isDark
    ? 'bg-[#14151B] border-[#282A36] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  const subHeaderBg = isDark
    ? 'bg-[#191A22] border-[#252730]'
    : isMono
    ? 'bg-[#F4F3EF] border-[#EAE7DF]'
    : 'bg-slate-50/50 border-slate-200';

  const footerBg = isDark
    ? 'bg-[#191A22] border-[#252730]'
    : isMono
    ? 'bg-[#F4F3EF] border-[#EAE7DF]'
    : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className={`flex flex-col w-full max-w-xl max-h-[85vh] rounded-3xl border-2 shadow-none overflow-hidden transition-colors ${modalBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isDark ? 'border-[#252730]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
              isDark
                ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
                : isMono
                ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}>
              <MingIcon name="folder_open_line" size={18} />
            </div>
            <div>
              <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'}`}>
                Project Hub
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'}`}>
                Switch between your active boards or launch a new one
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition cursor-pointer ${
              isDark
                ? 'text-[#8C90A0] hover:bg-[#22242D] hover:text-[#E2E4E9]'
                : isMono
                ? 'text-[#78756D] hover:bg-[#EFECE4] hover:text-[#242321]'
                : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
            }`}
            title="Close Project Hub (Esc)"
          >
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Quick New Project Bar */}
        <div className={`flex items-center justify-between border-b px-5 py-3 gap-2 ${subHeaderBg}`}>
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-600'}`}>
            <MingIcon name="information_line" size={14} className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-indigo-500'} />
            <span>1 Browser Tab = 1 Project. Open boards side-by-side.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCreateNewProject(true)}
              title="Open fresh blank board in a new browser tab"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#BAC0D0] text-[#0F1014] hover:bg-white'
                  : isMono
                  ? 'bg-[#242321] text-[#FCFBF9] hover:bg-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <MingIcon name="add_line" size={14} />
              <span>New Tab</span>
            </button>
            <button
              onClick={() => handleCreateNewProject(false)}
              title="Create new board in current window"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer border ${
                isDark
                  ? 'bg-[#1B1C24] text-[#D8DAE2] border-[#2C2E3A] hover:bg-[#232530]'
                  : isMono
                  ? 'bg-[#FCFBF9] text-[#242321] border-[#D8D4CA] hover:bg-[#EAE7DF]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <MingIcon name="add_line" size={14} />
              <span>This Tab</span>
            </button>
          </div>
        </div>

        {/* Saved Projects List */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-2 divide-y ${
          isDark ? 'divide-[#252730]' : isMono ? 'divide-[#EAE7DF]' : 'divide-slate-100'
        }`}>
          {loading ? (
            <div className={`py-12 text-center text-xs flex items-center justify-center gap-2 ${
              isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-400'
            }`}>
              <MingIcon name="loading_line" size={16} className="animate-spin text-slate-500" />
              <span>Loading saved projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-400'}`}>
              No saved projects found in database.
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = proj.id === currentCanvasId;
              const isDeleting = deletingId === proj.id;

              const itemBg = isCurrent
                ? isDark
                  ? 'bg-[#22242D] border-[#383B4A]'
                  : isMono
                  ? 'bg-[#EFECE4] border-[#D8D4CA]'
                  : 'bg-indigo-50/70 border-indigo-300'
                : isDark
                ? 'hover:bg-[#1B1C24] border-transparent hover:border-[#2C2E3A]'
                : isMono
                ? 'hover:bg-[#F4F3EF] border-transparent hover:border-[#E2DFD6]'
                : 'hover:bg-slate-50 border-transparent hover:border-slate-200';

              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id, false)}
                  className={`group flex items-center justify-between rounded-xl p-3 pt-3 transition cursor-pointer border ${itemBg}`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${
                        isCurrent
                          ? isDark
                            ? 'bg-[#BAC0D0] text-[#0F1014] border-[#BAC0D0]'
                            : isMono
                            ? 'bg-[#242321] text-[#FCFBF9] border-[#242321]'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                          ? 'bg-[#1B1C24] text-[#8C90A0] border-[#2C2E3A]'
                          : isMono
                          ? 'bg-[#FCFBF9] text-[#78756D] border-[#D8D4CA]'
                          : 'bg-white text-slate-600 border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      <MingIcon name={isCurrent ? 'board_fill' : 'board_line'} size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'}`}>
                          {proj.name || 'untitled board'}
                        </span>
                        {isCurrent && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isDark
                              ? 'bg-[#282A36] text-[#BAC0D0]'
                              : isMono
                              ? 'bg-[#E2DFD6] text-[#242321]'
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            Current
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-3 text-[11px] mt-0.5 ${
                        isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
                      }`}>
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
                      className={`rounded-lg p-1.5 transition cursor-pointer ${
                        isDark
                          ? 'text-[#8C90A0] hover:bg-[#282A36] hover:text-[#E2E4E9]'
                          : isMono
                          ? 'text-[#78756D] hover:bg-[#E2DFD6] hover:text-[#242321]'
                          : 'text-slate-400 hover:bg-slate-200 hover:text-slate-800'
                      }`}
                    >
                      <MingIcon name="external_link_line" size={15} />
                    </button>

                    {!isCurrent && (
                      <button
                        onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                        disabled={isDeleting}
                        title="Delete this project"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition disabled:opacity-50 cursor-pointer"
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
        <div className={`flex items-center justify-between border-t-2 px-5 py-3 ${footerBg}`}>
          <div className={`text-[11px] ${isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'}`}>
            Boards auto-save continuously to SQLite.
          </div>
          {onExportScriffle && (
            <button
              onClick={() => onExportScriffle()}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${
                isDark
                  ? 'border-[#2C2E3A] bg-[#181920] text-[#D8DAE2] hover:bg-[#22242D]'
                  : isMono
                  ? 'border-[#D8D4CA] bg-[#FCFBF9] text-[#242321] hover:bg-[#EAE7DF]'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
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
