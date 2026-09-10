'use client';

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import {
  TextConfig,
  TextFontSize,
  TextAlignment,
  TextHighlightColor,
  TextContainerStyle,
} from '@/types/canvas';
import { useTheme } from '@/context/ThemeContext';
import { TextFormatToolbar } from './text/TextFormatToolbar';

export const TextNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const { deleteElements, getNodes } = useReactFlow();
  const config = (data.config || {}) as TextConfig;

  const [text, setText] = useState(config.text || '');
  const [fontSize, setFontSize] = useState<TextFontSize>(config.fontSize || 'body');
  const [align, setAlign] = useState<TextAlignment>(config.align || 'left');
  const [bold, setBold] = useState<boolean>(Boolean(config.bold));
  const [italic, setItalic] = useState<boolean>(Boolean(config.italic));
  const [underline, setUnderline] = useState<boolean>(Boolean(config.underline));
  const [strike, setStrike] = useState<boolean>(Boolean(config.strike));
  const [highlight, setHighlight] = useState<TextHighlightColor>(config.highlight || 'none');
  const [containerStyle, setContainerStyle] = useState<TextContainerStyle>(
    config.containerStyle || 'plain'
  );
  const [isEditing, setIsEditing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  // Sync state with upstream config
  useEffect(() => {
    setText(config.text || '');
  }, [config.text]);

  useEffect(() => {
    setFontSize(config.fontSize || 'body');
  }, [config.fontSize]);

  useEffect(() => {
    setAlign(config.align || 'left');
  }, [config.align]);

  useEffect(() => {
    setBold(Boolean(config.bold));
  }, [config.bold]);

  useEffect(() => {
    setItalic(Boolean(config.italic));
  }, [config.italic]);

  useEffect(() => {
    setUnderline(Boolean(config.underline));
  }, [config.underline]);

  useEffect(() => {
    setStrike(Boolean(config.strike));
  }, [config.strike]);

  useEffect(() => {
    setHighlight(config.highlight || 'none');
  }, [config.highlight]);

  useEffect(() => {
    setContainerStyle(config.containerStyle || 'plain');
  }, [config.containerStyle]);

  // When node gets deselected, always exit editing mode
  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
    }
  }, [selected]);

  // Auto-resize textarea height to match EXACT content scrollHeight
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const nextHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      adjustHeight();
    }
  }, [text, fontSize, isEditing, adjustHeight]);

  const saveConfig = async (newConfig: Partial<TextConfig>) => {
    try {
      await fetch(`/api/canvas/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...config,
            ...newConfig,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to update text node config:', err);
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);
    if (
      text !== config.text ||
      fontSize !== config.fontSize ||
      align !== config.align ||
      bold !== config.bold ||
      italic !== config.italic ||
      underline !== config.underline ||
      strike !== config.strike ||
      highlight !== config.highlight ||
      containerStyle !== config.containerStyle
    ) {
      await saveConfig({
        text,
        fontSize,
        align,
        bold,
        italic,
        underline,
        strike,
        highlight,
        containerStyle,
      });
    }
  };

  // Live Markdown Prefix Handler
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;

    if (val.startsWith('# ') && fontSize !== 'title') {
      val = val.slice(2);
      setFontSize('title');
      saveConfig({ text: val, fontSize: 'title' });
    } else if (val.startsWith('## ') && fontSize !== 'header') {
      val = val.slice(3);
      setFontSize('header');
      saveConfig({ text: val, fontSize: 'header' });
    } else if ((val.startsWith('- ') || val.startsWith('* ')) && !val.startsWith('• ')) {
      val = '• ' + val.slice(2);
    }

    setText(val);
    adjustHeight();
  };

  // Bullet continuation on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const cursor = textareaRef.current?.selectionStart || 0;
      const currentLine = text.substring(0, cursor).split('\n').pop() || '';

      if (currentLine.startsWith('• ')) {
        e.preventDefault();
        if (currentLine.trim() === '•') {
          const before = text.substring(0, cursor - currentLine.length);
          const after = text.substring(cursor);
          setText(before + after);
          return;
        }
        const before = text.substring(0, cursor);
        const after = text.substring(cursor);
        const newText = before + '\n• ' + after;
        setText(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = cursor + 3;
            textareaRef.current.selectionEnd = cursor + 3;
            adjustHeight();
          }
        }, 0);
      }
    }
  };

  const handleResizeEnd = async (_event: any, params: { width: number; height: number }) => {
    try {
      await saveConfig({
        width: Math.round(params.width),
      });
    } catch (err) {
      console.error('Failed to save text node width:', err);
    }
  };

  // Double-click to enter editing mode & focus textarea
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustHeight();
      }
    }, 20);
  };

  // Font size classes
  const normalizedSize: 'title' | 'header' | 'body' | 'caption' =
    fontSize === 'large' || fontSize === 'title'
      ? 'title'
      : fontSize === 'header'
      ? 'header'
      : fontSize === 'small' || fontSize === 'caption'
      ? 'caption'
      : 'body';

  const fontClass =
    normalizedSize === 'title'
      ? 'text-2xl lg:text-3xl font-bold tracking-tight leading-[1.3]'
      : normalizedSize === 'header'
      ? 'text-lg lg:text-xl font-bold leading-[1.35]'
      : normalizedSize === 'caption'
      ? 'text-xs font-medium leading-[1.45]'
      : 'text-sm lg:text-base font-medium leading-[1.5]';

  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const decorationClass = `${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${
    underline ? 'underline' : ''
  } ${strike ? 'line-through' : ''}`;

  const highlightClass =
    highlight === 'yellow'
      ? isDark
        ? 'bg-[#854D0E]/60 text-amber-200 px-1 py-0.5 rounded-sm'
        : isMono
        ? 'bg-[#E5E0D0] text-[#242321] px-1 py-0.5 rounded-sm'
        : 'bg-[#FEF08A] text-amber-950 px-1.5 py-0.5 rounded-md'
      : highlight === 'mint'
      ? isDark
        ? 'bg-[#065F46]/60 text-emerald-200 px-1 py-0.5 rounded-sm'
        : isMono
        ? 'bg-[#D1CEC4] text-[#242321] px-1 py-0.5 rounded-sm'
        : 'bg-[#A7F3D0] text-emerald-950 px-1.5 py-0.5 rounded-md'
      : highlight === 'coral'
      ? isDark
        ? 'bg-[#9F1239]/60 text-rose-200 px-1 py-0.5 rounded-sm'
        : isMono
        ? 'bg-[#D8D4CA] text-[#242321] px-1 py-0.5 rounded-sm'
        : 'bg-[#FECDD3] text-rose-950 px-1.5 py-0.5 rounded-md'
      : highlight === 'purple'
      ? isDark
        ? 'bg-[#581C87]/60 text-purple-200 px-1 py-0.5 rounded-sm'
        : isMono
        ? 'bg-[#ECEAE4] text-[#242321] px-1 py-0.5 rounded-sm'
        : 'bg-[#E9D5FF] text-purple-950 px-1.5 py-0.5 rounded-md'
      : '';

  const containerClass =
    containerStyle === 'callout'
      ? isDark
        ? 'bg-[#14151B]/90 border-l-4 border-l-[#8E95A5] border-y border-r border-[#282A36] rounded-xl p-3 shadow-xs'
        : isMono
        ? 'bg-[#ECEAE4]/70 border-l-4 border-l-[#242321] border-y border-r border-[#D8D4CA] rounded-xl p-3 shadow-xs'
        : 'bg-blue-50/70 border-l-4 border-l-[#0050FF] border-y border-r border-blue-200/80 rounded-xl p-3 shadow-xs'
      : containerStyle === 'card'
      ? isDark
        ? 'bg-[#181920] border-2 border-[#282A36] rounded-2xl p-3.5 shadow-xs'
        : isMono
        ? 'bg-[#FCFBF9] border-2 border-[#D1CEC4] rounded-2xl p-3.5 shadow-xs'
        : 'bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-xs'
      : 'p-1';

  const selectedBorder = selected
    ? isDark
      ? 'ring-2 ring-[#8E95A5]/60'
      : isMono
      ? 'ring-2 ring-[#242321]/40'
      : 'ring-2 ring-[#0050FF]/50'
    : '';

  const textColor = isDark
    ? 'text-[#E2E4E9] placeholder:text-[#5A5D6E]'
    : isMono
    ? 'text-[#242321] placeholder:text-[#8C8980]'
    : 'text-slate-900 placeholder:text-slate-400';

  const customWidth = config.width ? `${config.width}px` : undefined;

  const allNodes = getNodes();
  const selectedCount = allNodes.filter((n) => n.selected).length;
  const showToolbar = isEditing && selectedCount === 1;

  // Exact shared typography styles across textarea and display div
  const sharedTypographyClasses = `w-full bg-transparent ${fontClass} ${alignClass} ${decorationClass} ${highlightClass} ${textColor} m-0 p-0 border-0 outline-none`;

  return (
    <div
      style={{ width: customWidth, minWidth: 160, maxWidth: 850 }}
      onDoubleClick={handleDoubleClick}
      className={`relative group transition-all duration-150 ${containerClass} ${selectedBorder}`}
    >
      {/* NodeResizer */}
      <NodeResizer
        isVisible={selected && selectedCount === 1}
        minWidth={160}
        maxWidth={850}
        onResizeEnd={handleResizeEnd}
        lineClassName={isDark ? 'border-[#8E95A5]' : isMono ? 'border-[#242321]' : 'border-[#0050FF]'}
        handleClassName={
          isDark
            ? 'h-2.5 w-2.5 bg-[#181920] border-2 border-[#8E95A5] rounded-sm'
            : isMono
            ? 'h-2.5 w-2.5 bg-[#FCFBF9] border-2 border-[#242321] rounded-sm'
            : 'h-2.5 w-2.5 bg-white border-2 border-[#0050FF] rounded-sm'
        }
      />

      {/* Floating Formatting Toolbar */}
      {showToolbar && (
        <TextFormatToolbar
          fontSize={fontSize}
          align={align}
          bold={bold}
          italic={italic}
          underline={underline}
          strike={strike}
          highlight={highlight}
          containerStyle={containerStyle}
          onChangeFontSize={(newSize) => {
            setFontSize(newSize);
            saveConfig({ fontSize: newSize });
          }}
          onChangeAlign={(newAlign) => {
            setAlign(newAlign);
            saveConfig({ align: newAlign });
          }}
          onToggleBold={() => {
            setBold(!bold);
            saveConfig({ bold: !bold });
          }}
          onToggleItalic={() => {
            setItalic(!italic);
            saveConfig({ italic: !italic });
          }}
          onToggleUnderline={() => {
            setUnderline(!underline);
            saveConfig({ underline: !underline });
          }}
          onToggleStrike={() => {
            setStrike(!strike);
            saveConfig({ strike: !strike });
          }}
          onChangeHighlight={(newHl) => {
            setHighlight(newHl);
            saveConfig({ highlight: newHl });
          }}
          onChangeContainerStyle={(newStyle) => {
            setContainerStyle(newStyle);
            saveConfig({ containerStyle: newStyle });
          }}
          onDelete={() => deleteElements({ nodes: [{ id }] })}
        />
      )}

      {/* WYSIWYG 1:1 Rendering Engine */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Type anything freely..."
          rows={1}
          autoFocus
          className={`${sharedTypographyClasses} resize-none overflow-hidden block nodrag nowheel`}
          style={{ boxSizing: 'border-box' }}
        />
      ) : (
        <div
          className={`${sharedTypographyClasses} select-none break-words whitespace-pre-wrap block ${
            !text ? 'opacity-40 italic' : ''
          }`}
          style={{ boxSizing: 'border-box' }}
        >
          {text || 'Double-click to edit text...'}
        </div>
      )}
    </div>
  );
});

TextNode.displayName = 'TextNode';
