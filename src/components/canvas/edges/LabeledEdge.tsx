'use client';

import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import { resolveEdgeLabel } from '@/lib/edgeLabels';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';

export interface LabeledEdgeData {
  label?: string;
  sourceNodeType?: string;
  targetNodeType?: string;
  [key: string]: any;
}

export interface CustomEdgeProps extends EdgeProps {
  sourceHandle?: string | null;
  targetHandle?: string | null;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
}

export const LabeledEdge: React.FC<CustomEdgeProps> = ({
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  sourceHandleId,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const resolvedSourceHandle = sourceHandle || sourceHandleId || null;
  const { theme, activeCustomTheme } = useTheme();
  const { setEdges, getNode } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customLabel, setCustomLabel] = useState<string>((data as LabeledEdgeData)?.label || '');

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 16,
  });

  // Source & Target Node Types
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  const sourceNodeType = (data as LabeledEdgeData)?.sourceNodeType || sourceNode?.type;
  const targetNodeType = (data as LabeledEdgeData)?.targetNodeType || targetNode?.type;

  const currentLabel = resolveEdgeLabel(
    (data as LabeledEdgeData)?.label || customLabel,
    sourceNodeType,
    targetNodeType,
    resolvedSourceHandle
  );

  const isCustom = theme === 'custom' && activeCustomTheme;
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const isConditionTrue = currentLabel === 'if true';
  const isConditionFalse = currentLabel === 'if false';

  // Badge pill styling based on theme
  let badgeBg = 'bg-white border-slate-300 text-slate-700 shadow-none';
  let badgeHover = 'hover:border-slate-400 hover:text-slate-900';
  let truePillClass = 'text-[#0050FF] font-bold';
  let falsePillClass = 'text-rose-600 font-bold';

  if (isCustom) {
    badgeBg = 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]';
    badgeHover = 'hover:border-[var(--custom-ui-primary)]';
    truePillClass = 'text-[var(--custom-ui-primary)] font-bold';
    falsePillClass = 'text-rose-500 font-bold';
  } else if (isDark) {
    badgeBg = 'bg-[#181920] border-[#2E3140] text-slate-200';
    badgeHover = 'hover:border-slate-500 hover:text-white';
    truePillClass = 'text-blue-400 font-bold';
    falsePillClass = 'text-rose-400 font-bold';
  } else if (isMono) {
    badgeBg = 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]';
    badgeHover = 'hover:border-[#9E9B90] hover:text-black';
    truePillClass = 'text-[#242321] font-black';
    falsePillClass = 'text-rose-700 font-bold';
  }

  // Handle deleting edge
  const handleDeleteEdge = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((prev) => prev.filter((edge) => edge.id !== id));
  };

  // Handle label editing commit
  const handleSaveLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
      setEdges((prev) =>
        prev.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...(edge.data || {}), label: customLabel.trim() } }
            : edge
        )
      );
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected || isHovered
            ? isCustom
              ? activeCustomTheme.ui.primary
              : isConditionFalse
              ? '#FF5B79'
              : '#0050FF'
            : isDark
            ? '#3A3D4D'
            : isMono
            ? '#8E8B82'
            : isConditionFalse
            ? '#FF5B79'
            : '#94A3B8',
          strokeWidth: selected || isHovered ? 2.5 : 2,
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan select-none group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={handleSaveLabel}
              onBlur={() => setIsEditing(false)}
              className={`rounded-lg border-2 px-2 py-0.5 text-[11px] font-semibold outline-none transition-all ${badgeBg}`}
              placeholder="Edge label..."
            />
          ) : currentLabel || isHovered || selected ? (
            <div
              className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-150 cursor-pointer ${badgeBg} ${badgeHover} ${
                selected ? 'ring-2 ring-[#0050FF]/20 border-[#0050FF]' : ''
              }`}
              onClick={() => setIsEditing(true)}
              title="Click to edit label"
            >
              {isConditionTrue && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
              {isConditionFalse && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              )}
              <span className={isConditionTrue ? truePillClass : isConditionFalse ? falsePillClass : 'font-medium'}>
                {currentLabel || 'Add label'}
              </span>

              {/* Quick delete button on hover/select */}
              {(isHovered || selected) && (
                <button
                  type="button"
                  onClick={handleDeleteEdge}
                  title="Delete connector"
                  className="ml-0.5 -mr-1 flex items-center justify-center rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                >
                  <MingIcon name="close_line" size={12} />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
