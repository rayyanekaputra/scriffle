'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileConfig, FileCategory } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

/**
 * Detects file category and extension from fileName/URL
 */
function resolveFileMeta(config: FileConfig): {
  category: FileCategory;
  ext: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
} {
  const fileName = config.fileName || config.fileUrl || 'attachment.file';
  const rawExt = config.extension || fileName.split('.').pop()?.toLowerCase() || '';
  const ext = rawExt.replace(/[^a-z0-9]/gi, '').toUpperCase() || 'FILE';

  let category: FileCategory = config.fileCategory || 'generic';

  if (!config.fileCategory) {
    if (['PDF'].includes(ext)) category = 'pdf';
    else if (['PPT', 'PPTX', 'KEY'].includes(ext)) category = 'presentation';
    else if (['DOC', 'DOCX', 'TXT', 'MD', 'RTF', 'PAGES'].includes(ext)) category = 'document';
    else if (['XLS', 'XLSX', 'CSV', 'NUMBERS'].includes(ext)) category = 'spreadsheet';
    else if (['MP3', 'WAV', 'M4A', 'OGG', 'FLAC', 'AAC'].includes(ext)) category = 'audio';
    else if (['JSON', 'TS', 'JS', 'PY', 'RS', 'GO', 'SCRIFFLE', 'HTML', 'CSS'].includes(ext)) category = 'code';
    else if (['ZIP', 'TAR', 'GZ', '7Z', 'RAR'].includes(ext)) category = 'archive';
  }

  switch (category) {
    case 'pdf':
      return {
        category,
        ext: ext || 'PDF',
        icon: 'file_pdf_2_line',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
        badgeText: 'text-rose-600 dark:text-rose-400',
        badgeBorder: 'border-rose-200 dark:border-rose-800/60',
      };
    case 'presentation':
      return {
        category,
        ext: ext || 'SLIDE',
        icon: 'presentation_line',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
        badgeText: 'text-amber-600 dark:text-amber-400',
        badgeBorder: 'border-amber-200 dark:border-amber-800/60',
      };
    case 'document':
      return {
        category,
        ext: ext || 'DOC',
        icon: 'file_word_2_line',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
        badgeText: 'text-blue-600 dark:text-blue-400',
        badgeBorder: 'border-blue-200 dark:border-blue-800/60',
      };
    case 'spreadsheet':
      return {
        category,
        ext: ext || 'XLS',
        icon: 'table_line',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        badgeText: 'text-emerald-600 dark:text-emerald-400',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'audio':
      return {
        category,
        ext: ext || 'AUDIO',
        icon: 'music_2_line',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
        badgeText: 'text-purple-600 dark:text-purple-400',
        badgeBorder: 'border-purple-200 dark:border-purple-800/60',
      };
    case 'code':
      return {
        category,
        ext: ext || 'CODE',
        icon: 'code_line',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
        badgeText: 'text-indigo-600 dark:text-indigo-400',
        badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
      };
    case 'archive':
      return {
        category,
        ext: ext || 'ZIP',
        icon: 'folder_download_line',
        badgeBg: 'bg-slate-100 dark:bg-slate-800/40',
        badgeText: 'text-slate-700 dark:text-slate-300',
        badgeBorder: 'border-slate-300 dark:border-slate-700',
      };
    default:
      return {
        category: 'generic',
        ext: ext || 'FILE',
        icon: 'attachment_line',
        badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
        badgeText: 'text-slate-600 dark:text-slate-400',
        badgeBorder: 'border-slate-200 dark:border-slate-800',
      };
  }
}

export const FileNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as FileConfig;

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const meta = resolveFileMeta(config);
  const fileName = config.fileName || 'Attached File';
  const fileUrl = config.fileUrl || '#';
  const fileSize = config.fileSize || '120 KB';

  const cardBorder = isDark
    ? selected
      ? 'border-[#8E95A5] ring-2 ring-[#8E95A5]/20'
      : 'border-[#282A36] hover:border-[#383B4A]'
    : isMono
    ? selected
      ? 'border-[#242321] ring-2 ring-[#242321]/20'
      : 'border-[#D1CEC4] hover:border-[#B5B0A2]'
    : selected
    ? 'border-[#0050FF] ring-2 ring-[#0050FF]/20'
    : 'border-slate-300 hover:border-slate-400';

  const cardBg = isDark
    ? 'bg-[#181920] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] text-[#242321]'
    : 'bg-white text-slate-900';

  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileUrl && fileUrl !== '#') {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenLocation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/file/open-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: config.filePath || config.fileName,
          fileUrl: config.fileUrl,
        }),
      });
    } catch (err) {
      console.error('Failed to open file location:', err);
    }
  };

  return (
    <div
      className={`group relative w-76 rounded-2xl border-2 p-3.5 transition-all duration-150 select-none ${cardBg} ${cardBorder}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#5A5852]'
            : '!border-white !bg-[#0050FF]'
        }`}
      />

      {/* Main Content Row */}
      <div className="flex items-center gap-3">
        {/* Dynamic File Type Icon Badge */}
        <div
          className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border-2 transition-transform duration-150 group-hover:scale-105 ${
            isMono
              ? 'border-[#C8C4B8] bg-[#EFECE4] text-[#242321]'
              : isDark
              ? `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`
              : `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`
          }`}
        >
          <MingIcon name={meta.icon as any} size={20} />
          <span className="text-[8px] font-black uppercase tracking-wider leading-none mt-0.5 font-mono">
            {meta.ext.slice(0, 4)}
          </span>
        </div>

        {/* File Information */}
        <div className="min-w-0 flex-1">
          <h4
            title={fileName}
            className={`truncate text-xs font-bold leading-tight ${
              isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
            }`}
          >
            {fileName}
          </h4>

          <div className="mt-1 flex items-center gap-2 text-[10px] font-medium">
            <span
              className={`font-mono ${
                isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {fileSize}
            </span>
            <span className={`text-[9px] ${isDark ? 'text-[#4A4D5E]' : isMono ? 'text-[#C8C4B8]' : 'text-slate-300'}`}>•</span>
            <span
              className={`capitalize ${
                isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {meta.category}
            </span>
          </div>
        </div>

        {/* Action Buttons: Open Location & Open in New Tab */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleOpenLocation}
            title="Open file location (Finder / Explorer / Files)"
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all active:scale-90 cursor-pointer ${
              isDark
                ? 'border-[#313442] bg-[#22242D] text-[#BAC0D0] hover:bg-[#2A2C38] hover:text-white'
                : isMono
                ? 'border-[#D8D4CA] bg-[#EFECE4] text-[#242321] hover:bg-[#E2DFD6]'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MingIcon name="folder_open_line" size={14} />
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            title="Open in new tab / play"
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all active:scale-90 cursor-pointer ${
              isDark
                ? 'border-[#313442] bg-[#22242D] text-[#BAC0D0] hover:bg-[#2A2C38] hover:text-white'
                : isMono
                ? 'border-[#D8D4CA] bg-[#EFECE4] text-[#242321] hover:bg-[#E2DFD6]'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MingIcon name="external_link_line" size={14} />
          </button>
        </div>
      </div>

      {/* Optional Caption */}
      {config.caption && (
        <div
          className={`mt-2.5 rounded-xl border p-2 text-[11px] leading-snug ${
            isDark
              ? 'border-[#262833] bg-[#121318] text-[#A0A4B4]'
              : isMono
              ? 'border-[#EAE7DF] bg-[#F4F3EF] text-[#5A5852]'
              : 'border-slate-100 bg-slate-50 text-slate-600'
          }`}
        >
          {config.caption}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#5A5852]'
            : '!border-white !bg-[#0050FF]'
        }`}
      />
    </div>
  );
});

FileNode.displayName = 'FileNode';
