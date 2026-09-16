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
}

export const QuickAddSourceHandle: React.FC<QuickAddSourceHandleProps> = ({
  nodeId,
  nodeType,
  nodeLabel,
  selected = false,
  className = '',
  id,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

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
            screenPosition: { x: clientX, y: clientY },
          },
        })
      );
    }
  };

  const handleBorder = isDark
    ? '!border-[#181920] !bg-[#8E95A5]'
    : isMono
    ? '!border-[#FCFBF9] !bg-[#5A5852]'
    : '!border-white !bg-[#0050FF]';

  const plusBtnBg = isDark
    ? 'bg-[#222530] border-[#3F4252] text-[#E2E4E9] hover:bg-[#0050FF] hover:text-white hover:border-[#0050FF]'
    : isMono
    ? 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321] hover:bg-[#242321] hover:text-white hover:border-[#242321]'
    : 'bg-white border-slate-300 text-slate-700 hover:bg-[#0050FF] hover:text-white hover:border-[#0050FF]';

  return (
    <>
      {/* Standard React Flow Source Handle (unmodified placement) */}
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 transition-transform hover:scale-125 ${handleBorder} ${className}`}
      />

      {/* Floating [+] Quick Add Button — offset 36px to the right of card edge */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[36px] z-20 pointer-events-auto flex items-center">
        <button
          type="button"
          onClick={handleClickPlus}
          title="Quick add connected node"
          aria-label="Quick add connected node"
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] transition-all duration-150 cursor-pointer ${
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
