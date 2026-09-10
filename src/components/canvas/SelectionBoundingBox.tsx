'use client';

import React, { useMemo } from 'react';
import { Node, useReactFlow } from '@xyflow/react';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';

interface SelectionBoundingBoxProps {
  nodes: Node[];
  onGroup?: () => void;
  onUngroup?: () => void;
}

export const SelectionBoundingBox: React.FC<SelectionBoundingBoxProps> = ({
  nodes,
  onGroup,
  onUngroup,
}) => {
  const { theme } = useTheme();
  const { getViewport } = useReactFlow();

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);

  // Compute bounding box in canvas coordinates when 2 or more nodes are selected
  const bounds = useMemo(() => {
    if (selectedNodes.length < 2) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((n) => {
      const x = n.position.x;
      const y = n.position.y;
      const width = (n.measured?.width || (n.data?.config as any)?.width || 280);
      const height = (n.measured?.height || (n.data?.config as any)?.height || 140);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    if (minX === Infinity) return null;

    const padding = 12;
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [selectedNodes]);

  if (!bounds || selectedNodes.length < 2) return null;

  const { x: vx, y: vy, zoom } = getViewport();

  // Convert canvas bounds to screen viewport coordinates for pixel-crisp Figma bounding box
  const screenLeft = bounds.x * zoom + vx;
  const screenTop = bounds.y * zoom + vy;
  const screenWidth = bounds.width * zoom;
  const screenHeight = bounds.height * zoom;

  const isGrouped = selectedNodes.every(
    (n) => (n.data as any)?.groupId || (n.data?.config as any)?._groupId
  );

  const strokeColor = isDark ? '#8E95A5' : isMono ? '#242321' : '#0050FF';
  const handleBg = isDark ? '#14151B' : '#FFFFFF';

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: `${screenLeft}px`,
        top: `${screenTop}px`,
        width: `${screenWidth}px`,
        height: `${screenHeight}px`,
      }}
    >
      {/* Outer Figma Selection Marquee Outline */}
      <div
        className="h-full w-full rounded-lg transition-all"
        style={{
          border: `1.5px dashed ${strokeColor}`,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : isMono ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 80, 255, 0.03)',
        }}
      />

      {/* 4 Corner Bounding Box Square Handles (Figma style) */}
      <div
        className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />
      <div
        className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />
      <div
        className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />
      <div
        className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />

      {/* 4 Edge Midpoint Handles */}
      <div
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2.5 w-2.5 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />
      <div
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-2.5 w-2.5 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />
      <div
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />
      <div
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-xs border-2 shadow-xs"
        style={{ borderColor: strokeColor, backgroundColor: handleBg }}
      />

      {/* Top Floating Selection Tag & Quick Group Pill (Interactive) */}
      <div className="pointer-events-auto absolute -top-9 left-0 flex items-center gap-1.5 select-none">
        <div
          className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold backdrop-blur-md shadow-xs ${
            isDark
              ? 'bg-[#181920]/95 border-[#282A36] text-[#BAC0D0]'
              : isMono
              ? 'bg-[#FCFBF9]/95 border-[#D8D4CA] text-[#242321]'
              : 'bg-white/95 border-slate-300 text-slate-800'
          }`}
        >
          <MingIcon name={isGrouped ? 'group_line' : 'layout_grid_line'} size={13} className="text-[#0050FF]" />
          <span>{isGrouped ? 'Group' : `${selectedNodes.length} objects`}</span>
        </div>

        {onGroup && !isGrouped && (
          <button
            type="button"
            onClick={onGroup}
            title="Group elements (Cmd+G)"
            className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold backdrop-blur-md transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1E202B] hover:bg-[#2A2D3D] border-[#313444] text-[#E2E4E9]'
                : isMono
                ? 'bg-[#ECEAE4] hover:bg-[#E0DDD5] border-[#D1CEC4] text-[#242321]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <MingIcon name="group_line" size={13} />
            <span>Group</span>
            <span className="opacity-50 text-[10px]">Cmd+G</span>
          </button>
        )}

        {onUngroup && isGrouped && (
          <button
            type="button"
            onClick={onUngroup}
            title="Ungroup elements (Cmd+Shift+G)"
            className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold backdrop-blur-md transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1E202B] hover:bg-[#2A2D3D] border-[#313444] text-[#E2E4E9]'
                : isMono
                ? 'bg-[#ECEAE4] hover:bg-[#E0DDD5] border-[#D1CEC4] text-[#242321]'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <MingIcon name="ungroup_line" size={13} />
            <span>Ungroup</span>
            <span className="opacity-50 text-[10px]">Cmd+Shift+G</span>
          </button>
        )}
      </div>
    </div>
  );
};
