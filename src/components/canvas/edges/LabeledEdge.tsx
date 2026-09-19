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

export const LabeledEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
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
    targetNodeType
  );

  const isCustom = theme === 'custom' && activeCustomTheme;
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  // Badge pill styling based on theme
  let badgeBg = 'bg-white border-slate-300 text-slate-700 shadow-none';
  let badgeHover = 'hover:border-slate-400 hover:text-slate-900';
  let conditionPill = 'text-[#0050FF] font-bold';

  if (isCustom) {
    badgeBg = 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]';
    badgeHover = 'hover:border-[var(--custom-ui-primary)]';
    conditionPill = 'text-[var(--custom-ui-primary)] font-bold';
  } else if (isDark) {
    badgeBg = 'bg-[#181920] border-[#2E3140] text-slate-200';
    badgeHover = 'hover:border-slate-500 hover:text-white';
    conditionPill = 'text-blue-400 font-bold';
  } else if (isMono) {
    badgeBg = 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]';
    badgeHover = 'hover:border-[#9E9B90] hover:text-black';
    conditionPill = 'text-[#242321] font-black';
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

  const isConditionEdge = currentLabel === 'if true';

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
              : '#0050FF'
            : isDark
            ? '#3A3D4D'
            : isMono
            ? '#8E8B82'
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
              className={`flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-150 cursor-pointer ${badgeBg} ${badgeHover} ${
                selected ? 'ring-2 ring-[#0050FF]/20 border-[#0050FF]' : ''
              }`}
              onClick={() => setIsEditing(true)}
              title="Click to edit label"
            >
              {isConditionEdge && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
              <span className={isConditionEdge ? conditionPill : 'font-medium'}>
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
