'use client';

import React, { useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';
import { ScriffleTheme } from '@/types/theme';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeLoadedNotification?: (themeName: string) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  onThemeLoadedNotification,
}) => {
  const {
    theme,
    activeCustomTheme,
    customThemes,
    setTheme,
    importTheme,
    exportTheme,
    deleteCustomTheme,
  } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark' || (theme === 'custom' && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const modalBg = isDark
    ? 'border-[#282A36] bg-[#14151B] text-[#E2E4E9]'
    : isMono
    ? 'border-[#D8D4CA] bg-[#FCFBF9] text-[#242321]'
    : 'border-slate-300 bg-white text-slate-900';

  const headerDivider = isDark
    ? 'border-[#252730]'
    : isMono
    ? 'border-[#D8D4CA]'
    : 'border-slate-200';

  const iconBoxClass = isDark
    ? 'border-[#282A36] bg-[#1E2028] text-blue-400'
    : isMono
    ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#1D4ED8]'
    : 'border-slate-200 bg-blue-50 text-blue-600';

  const textMutedClass = isDark
    ? 'text-[#8E919E]'
    : isMono
    ? 'text-[#78756D]'
    : 'text-slate-500';

  const sectionLabelClass = isDark
    ? 'text-[#8E919E]'
    : isMono
    ? 'text-[#78756D]'
    : 'text-slate-500';

  const cardIdleClass = isDark
    ? 'border-[#282A36] bg-[#1A1B22] text-[#E2E4E9] hover:border-[#3E4254]'
    : isMono
    ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#242321] hover:border-[#B5B0A2]'
    : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:border-slate-300 hover:bg-slate-50';

  const cardActiveClass = isDark
    ? 'border-blue-500 bg-[#1E2232] text-white ring-2 ring-blue-500/20'
    : isMono
    ? 'border-[#1D4ED8] bg-[#EAE7DF] text-[#242321] ring-2 ring-[#1D4ED8]/20'
    : 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-500/20';

  const swatchBoxClass = isDark
    ? 'border-[#252730] bg-[#14151B]'
    : isMono
    ? 'border-[#D8D4CA] bg-[#ECEAE4]'
    : 'border-slate-200 bg-white';

  const buttonSecondaryClass = isDark
    ? 'border-[#282A36] bg-[#1A1B22] text-[#E2E4E9] hover:bg-[#22242D] hover:border-[#3E4254]'
    : isMono
    ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#242321] hover:bg-[#EAE7DF] hover:border-[#B5B0A2]'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const loaded = importTheme(content);
          if (onThemeLoadedNotification) {
            onThemeLoadedNotification(loaded.metadata.name);
          }
        } catch (err) {
          console.error('Failed to import theme:', err);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs">
      <div className={`relative w-full max-w-xl rounded-2xl border-2 p-6 transition-all shadow-2xl ${modalBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${headerDivider}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${iconBoxClass}`}>
              <MingIcon name="palette_line" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Theme Customization Engine</h2>
              <p className={`text-xs ${textMutedClass}`}>
                Switch environments or drop custom <code className={`rounded px-1 py-0.5 text-[11px] font-mono border ${isDark ? 'border-[#282A36] bg-[#1E2028]' : isMono ? 'border-[#D8D4CA] bg-[#EAE7DF]' : 'border-slate-200 bg-slate-100'}`}>.scrifflemes</code> configs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors cursor-pointer ${
              isDark ? 'text-[#8E919E] hover:text-white hover:bg-[#1E2028]' : isMono ? 'text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section 1: Standard Modes */}
          <div>
            <label className={`text-xs font-bold uppercase ${sectionLabelClass}`}>
              Standard Environments
            </label>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {/* Light */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  theme === 'light' ? cardActiveClass : cardIdleClass
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-lg">☀️</span>
                  {theme === 'light' && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-bold">Light Mode</div>
                <div className={`text-[11px] ${textMutedClass}`}>Energetic FigJam</div>
              </button>

              {/* Mono */}
              <button
                type="button"
                onClick={() => setTheme('mono')}
                className={`flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  theme === 'mono' ? cardActiveClass : cardIdleClass
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-lg">📜</span>
                  {theme === 'mono' && (
                    <span className="rounded-full bg-[#1D4ED8] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-bold">Mono Mode</div>
                <div className={`text-[11px] ${textMutedClass}`}>Warm-Paper Stone</div>
              </button>

              {/* Dark */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${
                  theme === 'dark' ? cardActiveClass : cardIdleClass
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-lg">🌙</span>
                  {theme === 'dark' && (
                    <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-bold">Dark Mode</div>
                <div className={`text-[11px] ${textMutedClass}`}>Soft Charcoal Matte</div>
              </button>
            </div>
          </div>

          {/* Section 2: Scriffle Theme Presets (.scrifflemes) */}
          <div>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold uppercase ${sectionLabelClass}`}>
                Terminal & Custom Presets (.scrifflemes)
              </label>
              <span className={`text-[11px] ${textMutedClass}`}>
                {customThemes.length} available
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {customThemes.map((t) => {
                const isSelected = theme === 'custom' && activeCustomTheme?.id === t.id;
                return (
                  <div
                    key={t.id}
                    className={`group relative flex flex-col justify-between rounded-xl border-2 p-3 transition-all ${
                      isSelected ? cardActiveClass : cardIdleClass
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setTheme('custom', t)}
                      className="flex flex-col items-start w-full text-left cursor-pointer"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-bold truncate">
                          {t.metadata.name}
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] truncate ${textMutedClass}`}>
                        {t.metadata.author || 'Custom'}
                      </span>

                      {/* Swatch Preview */}
                      <div className={`mt-2.5 flex w-full items-center gap-1 rounded-md border p-1 ${swatchBoxClass}`}>
                        <div
                          className="h-3.5 flex-1 rounded-xs"
                          style={{ backgroundColor: t.canvas.background }}
                          title={`Canvas: ${t.canvas.background}`}
                        />
                        <div
                          className="h-3.5 flex-1 rounded-xs"
                          style={{ backgroundColor: t.ui.primary }}
                          title={`Primary: ${t.ui.primary}`}
                        />
                        <div
                          className="h-3.5 flex-1 rounded-xs"
                          style={{ backgroundColor: t.nodes.watcher || '#10B981' }}
                          title={`Watcher: ${t.nodes.watcher}`}
                        />
                        <div
                          className="h-3.5 flex-1 rounded-xs"
                          style={{ backgroundColor: t.nodes.condition || '#FFD728' }}
                          title={`Condition: ${t.nodes.condition}`}
                        />
                        <div
                          className="h-3.5 flex-1 rounded-xs"
                          style={{ backgroundColor: t.nodes.surface_card }}
                          title={`Card: ${t.nodes.surface_card}`}
                        />
                      </div>
                    </button>

                    {/* Delete button if user custom (not builtin) */}
                    {!t.isBuiltin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomTheme(t.id);
                        }}
                        className="mt-2 text-[10px] text-rose-500 hover:text-rose-700 underline self-end cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`mt-6 flex items-center justify-between border-t pt-4 ${headerDivider}`}>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".scrifflemes,.conf,.ini,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${buttonSecondaryClass}`}
            >
              <MingIcon name="upload_line" size={14} />
              <span>Import .scrifflemes</span>
            </button>

            {theme === 'custom' && activeCustomTheme && (
              <button
                type="button"
                onClick={() => exportTheme(activeCustomTheme)}
                className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${buttonSecondaryClass}`}
              >
                <MingIcon name="download_line" size={14} />
                <span>Export Theme</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
