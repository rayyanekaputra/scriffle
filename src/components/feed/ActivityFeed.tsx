'use client';

import React from 'react';
import { ExecutionLog, CanvasNodeData } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

interface ActivityFeedProps {
  logs: ExecutionLog[];
  nodes?: CanvasNodeData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
  onHoverNodes?: (nodeIds: string[]) => void;
}

/**
 * Resolves human-friendly label and icon for a given canvas node
 */
function resolveNodeMeta(node?: CanvasNodeData) {
  if (!node) {
    return {
      icon: 'sparkles_line',
      label: 'Card',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }

  const cfg: any = node.config || {};

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
}) => {
  const [width, setWidth] = React.useState(360);
  const [isResizing, setIsResizing] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(360);

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
      // Dragging to the left increases width; dragging right decreases width
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

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`relative flex flex-col h-full z-30 border-l-2 border-slate-200 bg-white p-4 select-text ${
        isResizing ? 'select-none transition-none' : 'transition-[width]'
      }`}
    >
      {/* Resizing Left Border Handle */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar width"
        className="group absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize z-40 flex items-center justify-center hover:bg-indigo-500/10 transition"
      >
        <div className="h-8 w-1 rounded-full bg-slate-300 group-hover:bg-indigo-600 transition" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
        <div className="flex items-center gap-2">
          <MingIcon name="history_line" size={18} className="text-slate-700" />
          <h2 className="text-sm font-bold text-slate-800">Activity Feed</h2>
          {width > 420 && (
            <span className="text-[10px] text-slate-400 font-mono">({width}px)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {width !== 360 && (
            <button
              onClick={() => setWidth(360)}
              className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition"
              title="Reset width to default"
            >
              Reset
            </button>
          )}
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-ping" />
            Live
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Hide Activity Feed"
          >
            <MingIcon name="close_line" size={16} />
          </button>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-400">
            <MingIcon name="time_line" size={28} className="text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No market triggers yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Use demo controls to test graph flow.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onMouseEnter={() => onHoverNodes?.(log.triggeredNodes)}
              onMouseLeave={() => onHoverNodes?.([])}
              className="group rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3 text-xs transition-all hover:border-indigo-400 hover:bg-white hover:shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-200">
                <span className="flex items-center gap-1">
                  <MingIcon name="time_line" size={12} className="text-slate-400" />
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition">
                  {log.triggeredNodes.length} cards triggered
                </span>
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                {log.eventSummary}
              </p>

              {/* Execution Flow Breadcrumb / Triggered Node Badges */}
              {log.triggeredNodes.length > 0 && (
                <div className="mt-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Execution Chain:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.triggeredNodes.map((nodeId, idx) => {
                      const meta = resolveNodeMeta(nodeMap.get(nodeId));
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
                            <span className="text-slate-300 text-[10px] font-bold">→</span>
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
