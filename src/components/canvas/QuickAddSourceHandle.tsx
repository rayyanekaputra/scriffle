'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface QuickAddSourceHandleProps {
  nodeId: string;
  nodeType: NodeType;
  nodeLabel?: string;
  selected?: boolean;
  className?: string;
  id?: string;
  handleId?: string;
  positionStyle?: React.CSSProperties;
  variant?: 'default' | 'true' | 'false';
}

export const QuickAddSourceHandle: React.FC<QuickAddSourceHandleProps> = ({
  nodeId,
  nodeType,
  nodeLabel,
  selected = false,
  className = '',
  id,
  handleId,
  positionStyle,
  variant = 'default',
}) => {
  const { theme, activeCustomTheme } = useTheme();
  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const resolvedHandleId = handleId || id;
  const isFalseVariant = variant === 'false' || resolvedHandleId === 'false';
  const isTrueVariant = variant === 'true' || resolvedHandleId === 'true';

  const handleClickPlus = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = rect.right + 12;
    const clientY = rect.top;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('scriffle:quick-add', {
          detail: {
            nodeId,
            sourceNodeType: nodeType,
            sourceNodeLabel: nodeLabel || nodeType,
            sourceHandleId: resolvedHandleId || null,
            screenPosition: { x: clientX, y: clientY },
          },
        })
      );
    }
  };

  const handleBorder = isCustom && activeCustomTheme
    ? isFalseVariant
      ? '!border-[var(--custom-node-card-bg)] !bg-[#FF5B79]'
      : isTrueVariant
      ? '!border-[var(--custom-node-card-bg)] !bg-[#10B981]'
      : '!border-[var(--custom-node-card-bg)] !bg-[var(--custom-ui-primary)]'
    : isDark
    ? isFalseVariant
      ? '!border-[#181920] !bg-[#FF5B79]'
      : isTrueVariant
      ? '!border-[#181920] !bg-[#10B981]'
      : '!border-[#181920] !bg-[#8E95A5]'
    : isMono
    ? isFalseVariant
      ? '!border-[#FCFBF9] !bg-[#9E2A2B]'
      : isTrueVariant
      ? '!border-[#FCFBF9] !bg-[#2D6A4F]'
      : '!border-[#FCFBF9] !bg-[#5A5852]'
    : isFalseVariant
    ? '!border-white !bg-[#FF5B79]'
    : isTrueVariant
    ? '!border-white !bg-[#10B981]'
    : '!border-white !bg-[#0050FF]';

  const plusBtnBg = isCustom && activeCustomTheme
    ? isFalseVariant
      ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)] hover:bg-[#FF5B79] hover:text-white hover:border-[#FF5B79]'
      : isTrueVariant
      ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)] hover:bg-[#10B981] hover:text-white hover:border-[#10B981]'
      : 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)] hover:bg-[var(--custom-ui-primary)] hover:text-white hover:border-[var(--custom-ui-primary)]'
    : isDark
    ? isFalseVariant
      ? 'bg-[#222530] border-[#3F4252] text-[#E2E4E9] hover:bg-[#FF5B79] hover:text-white hover:border-[#FF5B79]'
      : isTrueVariant
      ? 'bg-[#222530] border-[#3F4252] text-[#E2E4E9] hover:bg-[#10B981] hover:text-white hover:border-[#10B981]'
      : 'bg-[#222530] border-[#3F4252] text-[#E2E4E9] hover:bg-[#0050FF] hover:text-white hover:border-[#0050FF]'
    : isMono
    ? isFalseVariant
      ? 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321] hover:bg-[#9E2A2B] hover:text-white hover:border-[#9E2A2B]'
      : isTrueVariant
      ? 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321] hover:bg-[#2D6A4F] hover:text-white hover:border-[#2D6A4F]'
      : 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321] hover:bg-[#242321] hover:text-white hover:border-[#242321]'
    : isFalseVariant
    ? 'bg-white border-slate-300 text-slate-700 hover:bg-[#FF5B79] hover:text-white hover:border-[#FF5B79]'
    : isTrueVariant
    ? 'bg-white border-slate-300 text-slate-700 hover:bg-[#10B981] hover:text-white hover:border-[#10B981]'
    : 'bg-white border-slate-300 text-slate-700 hover:bg-[#0050FF] hover:text-white hover:border-[#0050FF]';

  const containerTopOffset = positionStyle?.top ? '' : 'top-1/2 -translate-y-1/2';

  return (
    <>
      {/* Standard React Flow Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={resolvedHandleId}
        style={positionStyle}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 transition-transform hover:scale-125 ${handleBorder} ${className}`}
      />

      {/* Floating [+] Quick Add Button */}
      <div
        style={positionStyle ? { top: positionStyle.top, transform: 'translateY(-50%)' } : undefined}
        className={`absolute right-0 ${containerTopOffset} translate-x-[36px] z-20 pointer-events-auto flex items-center`}
      >
        <button
          type="button"
          onClick={handleClickPlus}
          title={`Quick add connected node (${isFalseVariant ? 'False branch' : isTrueVariant ? 'True branch' : 'output'})`}
          aria-label={`Quick add connected node (${isFalseVariant ? 'False branch' : isTrueVariant ? 'True branch' : 'output'})`}
          className={`quick-add-handle-btn flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] transition-all duration-150 cursor-pointer ${
            selected
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-90 group-hover/node:opacity-100 group-hover/node:scale-100'
          } ${plusBtnBg}`}
        >
          <MingIcon name="add_line" size={11} />
        </button>
      </div>
    </>
  );
};
