'use client';

import React from 'react';
import { ExecutionLog, CanvasNodeData } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface ActivityFeedProps {
  logs: ExecutionLog[];
  nodes?: CanvasNodeData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
  onHoverNodes?: (nodeIds: string[]) => void;
  onClearLogs?: () => void;
}

/**
 * Resolves human-friendly label and icon for a given canvas node
 */
function resolveNodeMeta(node?: CanvasNodeData, theme = 'light') {
  if (!node) {
    return {
      icon: 'sparkles_line',
      label: 'Card',
      bg: theme === 'dark' ? 'bg-[#181920] text-[#BAC0D0] border-[#282A36]' : theme === 'mono' ? 'bg-[#FCFBF9] text-[#242321] border-[#D8D4CA]' : 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  const cfg: any = node.config || {};
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  if (isDark) {
    return {
      icon: node.type === 'watcher' ? 'radar_line' : node.type === 'condition' ? 'filter_line' : node.type === 'note' ? 'quill_pen_line' : node.type === 'alert' ? 'notification_line' : node.type === 'action' ? 'flash_line' : node.type === 'sticker' ? 'star_line' : 'sparkles_line',
      label: node.type === 'watcher' ? `Watcher (${cfg.symbol || 'BBCA'})` : node.type.charAt(0).toUpperCase() + node.type.slice(1),
      bg: 'bg-[#181920] text-[#D8DAE2] border-[#282A36] hover:bg-[#22242D]',
    };
  }

  if (isMono) {
    return {
      icon: node.type === 'watcher' ? 'radar_line' : node.type === 'condition' ? 'filter_line' : node.type === 'note' ? 'quill_pen_line' : node.type === 'alert' ? 'notification_line' : node.type === 'action' ? 'flash_line' : node.type === 'sticker' ? 'star_line' : 'sparkles_line',
      label: node.type === 'watcher' ? `Watcher (${cfg.symbol || 'BBCA'})` : node.type.charAt(0).toUpperCase() + node.type.slice(1),
      bg: 'bg-[#FCFBF9] text-[#242321] border-[#D8D4CA] hover:bg-[#EAE7DF]',
    };
  }

  switch (node.type) {
    case 'watcher':
      return {
        icon: 'radar_line',
        label: `Watcher (${cfg.symbol || 'BBCA'})`,
        bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      };
    case 'condition':
      return {
        icon: 'filter_line',
        label: `Rule (${cfg.rule ? cfg.rule.slice(0, 14) + (cfg.rule.length > 14 ? '…' : '') : 'Condition'})`,
        bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
      };
    case 'note':
      const textSnippet = (cfg.content || '').slice(0, 12).trim();
      return {
        icon: 'quill_pen_line',
        label: textSnippet ? `Note ("${textSnippet}…")` : 'Sticky Note',
        bg: 'bg-yellow-50 text-amber-900 border-yellow-300 hover:bg-yellow-100',
      };
    case 'alert':
      const chan = cfg.channel === 'telegram' ? 'Telegram' : cfg.channel === 'webhook' ? 'Webhook' : 'Toast';
      return {
        icon: 'notification_line',
        label: `Alert (${chan})`,
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      };
    case 'action':
      return {
        icon: 'flash_line',
        label: `Action (${cfg.action || 'Mutation'})`,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
      };
    case 'sticker':
      return {
        icon: 'star_line',
        label: `Sticker (${cfg.stickerType || 'Badge'})`,
        bg: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
      };
    case 'text':
      return {
        icon: 'font_size_line',
        label: 'Text Label',
        bg: 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
      };
    case 'image':
      return {
        icon: 'pic_line',
        label: 'Image Asset',
        bg: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100',
      };
    default:
      return {
        icon: 'sparkles_line',
        label: `Card (${node.type})`,
        bg: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
      };
  }
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  logs,
  nodes = [],
  isOpen,
  onClose,
  onSelectNode,
  onHoverNodes,
  onClearLogs,
}) => {
  const { theme } = useTheme();
  const [width, setWidth] = React.useState(360);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(360);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  // Drag-to-resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 280), 750);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  if (!isOpen) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const asideBg = isDark
    ? 'bg-[#14151B] border-[#252730] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-200 text-slate-900';

  const headerBorder = isDark ? 'border-[#252730]' : isMono ? 'border-[#D8D4CA]' : 'border-slate-100';
  const logCardBg = isDark ? 'bg-[#181920] border-[#282A36]' : isMono ? 'bg-[#F4F3EF] border-[#D8D4CA]' : 'bg-slate-50/70 border-slate-200';
  const logCardBorderSubtle = isDark ? 'border-[#252730]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-200';
  const textHeading = isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-800';
  const textMuted = isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500';

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`relative flex flex-col h-full z-30 border-l-2 select-text transition-colors ${asideBg} ${
        isResizing ? 'select-none transition-none' : 'transition-[width]'
      }`}
    >
      {/* Resizing Left Border Handle */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar width"
        className="group absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize z-40 flex items-center justify-center hover:bg-black/10 transition"
      >
        <div className={`h-8 w-1 rounded-full ${isDark ? 'bg-[#313442] group-hover:bg-[#8E95A5]' : 'bg-slate-300 group-hover:bg-slate-600'} transition`} />
      </div>

      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b-2 ${headerBorder}`}>
        <div className="flex items-center gap-2">
          <MingIcon name="history_line" size={18} className={textHeading} />
          <h2 className={`text-sm font-bold ${textHeading}`}>Activity Feed</h2>
          {width > 420 && (
            <span className={`text-[10px] font-mono ${textMuted}`}>({width}px)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {logs.length > 0 && (
            <button
              onClick={() => setIsConfirmingClear(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
              title="Clear all activity feeds"
            >
              <MingIcon name="delete_2_line" size={12} className="text-rose-500" />
              <span>Clear</span>
            </button>
          )}
          {width !== 360 && (
            <button
              onClick={() => setWidth(360)}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                isDark ? 'text-[#8C90A0] hover:bg-[#22242D]' : isMono ? 'text-[#78756D] hover:bg-[#E2DFD6]' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Reset width to default"
            >
              Reset
            </button>
          )}
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
            isDark ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]' : isMono ? 'bg-[#EAE7DF] text-[#242321] border-[#D8D4CA]' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full animate-ping ${isDark ? 'bg-[#BAC0D0]' : isMono ? 'bg-[#242321]' : 'bg-slate-500'}`} />
            Live
          </span>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 transition cursor-pointer ${
              isDark ? 'text-[#8C90A0] hover:bg-[#22242D] hover:text-[#E2E4E9]' : isMono ? 'text-[#78756D] hover:bg-[#E2DFD6] hover:text-[#242321]' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="Hide Activity Feed"
          >
            <MingIcon name="close_line" size={16} />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Prompt Modal */}
      {isConfirmingClear && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className={`w-full max-w-xs rounded-2xl border-2 p-4 text-center shadow-none ${
            isDark ? 'bg-[#181920] border-[#282A36] text-[#E2E4E9]' : isMono ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2.5">
              <MingIcon name="delete_2_line" size={20} />
            </div>
            <h3 className={`text-xs font-bold ${textHeading}`}>Are you sure to clear?</h3>
            <p className={`mt-1 text-[11px] leading-relaxed ${textMuted}`}>
              This will pause the streaming ticks, remove all {logs.length} activity feed entries, and <strong className={textHeading}>reset run counters to 0</strong>.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className={`flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'border-[#2C2E3A] bg-[#14151B] text-[#8C90A0] hover:bg-[#22242D]' : isMono ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D] hover:bg-[#EAE7DF]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingClear(false);
                  onClearLogs?.();
                }}
                className="flex-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
        {logs.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-48 text-center text-xs ${textMuted}`}>
            <MingIcon name="time_line" size={28} className={`mb-2 ${textMuted}`} />
            <p className={`font-semibold ${textHeading}`}>No market triggers yet.</p>
            <p className="text-[11px] mt-1">Use demo controls to test graph flow.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onMouseEnter={() => onHoverNodes?.(log.triggeredNodes)}
              onMouseLeave={() => onHoverNodes?.([])}
              className={`group rounded-2xl border-2 p-3 text-xs transition-all ${logCardBg}`}
            >
              <div className={`flex items-center justify-between text-[11px] pb-1.5 border-b ${logCardBorderSubtle} ${textMuted}`}>
                <span className="flex items-center gap-1">
                  <MingIcon name="time_line" size={12} className={textMuted} />
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  isDark ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]' : isMono ? 'bg-[#EAE7DF] text-[#242321] border-[#D8D4CA]' : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {log.triggeredNodes.length} cards triggered
                </span>
              </div>

              <p className={`mt-2 text-xs font-semibold leading-snug ${textHeading}`}>
                {log.eventSummary}
              </p>

              {/* Execution Flow Breadcrumb */}
              {log.triggeredNodes.length > 0 && (
                <div className="mt-2.5 space-y-1">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
                    Execution Chain:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.triggeredNodes.map((nodeId, idx) => {
                      const meta = resolveNodeMeta(nodeMap.get(nodeId), theme);
                      return (
                        <React.Fragment key={idx}>
                          <button
                            type="button"
                            onClick={() => onSelectNode?.(nodeId)}
                            title={`Click to focus on ${meta.label} in canvas`}
                            className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition-all ${meta.bg}`}
                          >
                            <MingIcon name={meta.icon} size={11} />
                            <span>{meta.label}</span>
                          </button>
                          {idx < log.triggeredNodes.length - 1 && (
                            <span className={`text-[10px] font-bold ${textMuted}`}>→</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
