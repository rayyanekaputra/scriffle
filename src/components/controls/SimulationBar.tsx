'use client';

import React, { useState } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { DevSpikeTool } from './DevSpikeTool';
import { useTheme } from '@/context/ThemeContext';

interface SimulationBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateSuccess?: () => void;
  onSimulateCustom?: (eventPayload: any) => void;
  autoTickActive?: boolean;
  onToggleAutoTick?: (active: boolean, intervalSec: number) => void;
  onExportScriffle?: () => void;
  onImportScriffle?: (file: File) => void;
  onLoadPreset?: (presetName: string) => void;
  apiKey?: string;
  onApiKeyChange?: (key: string) => void;
  onPollMarket?: () => Promise<void>;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  isOpen,
  onClose,
  onSimulateSuccess,
  onSimulateCustom,
  autoTickActive = false,
  onToggleAutoTick,
  onExportScriffle,
  onImportScriffle,
  onLoadPreset,
  apiKey = '',
  onApiKeyChange,
  onPollMarket,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isDevToolOpen, setIsDevToolOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const scriffleInputRef = React.useRef<HTMLInputElement>(null);

  const isLiveMode = Boolean(apiKey && apiKey.trim().length > 0);
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const handleScriffleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImportScriffle?.(files[0]);
      e.target.value = '';
    }
  };

  const runSimulation = async (presetName: string, eventPayload: any) => {
    setLoading(true);
    setActivePreset(presetName);
    try {
      if (onSimulateCustom) {
        onSimulateCustom(eventPayload);
      } else {
        const res = await fetch('/api/engine/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: eventPayload }),
        });
        if (res.ok) {
          onSimulateSuccess?.();
        }
      }
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setActivePreset(null), 1000);
    }
  };

  const runLivePoll = async () => {
    setLoading(true);
    try {
      if (onPollMarket) {
        await onPollMarket();
      } else {
        const res = await fetch('/api/engine/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: apiKey.trim() }),
        });
        if (res.ok) {
          onSimulateSuccess?.();
        }
      }
    } catch (err) {
      console.error('Live poll failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const asideBg = isDark
    ? 'bg-[#14151B] border-[#252730] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-200 text-slate-900';

  const cardContainer = isDark
    ? 'bg-[#181920] border-[#282A36]'
    : isMono
    ? 'bg-[#F4F3EF] border-[#D8D4CA]'
    : 'bg-slate-50/90 border-slate-200';

  const subCard = isDark
    ? 'bg-[#14151B] border-[#252732] text-[#D8DAE2] hover:bg-[#1E202B]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321] hover:bg-[#EFECE4]'
    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

  const textHeading = isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-800';
  const textMuted = isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500';
  const iconColor = isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-600';

  return (
    <>
      <aside className={`w-72 border-r-2 p-4 flex flex-col h-full z-30 transition-colors ${asideBg}`}>
        {/* Hidden File Input for .scriffle / .json */}
        <input
          ref={scriffleInputRef}
          type="file"
          accept=".scriffle,.json"
          className="hidden"
          onChange={handleScriffleUpload}
        />

        {/* Panel Header */}
        <div className={`flex items-center justify-between pb-3 border-b-2 ${
          isDark ? 'border-[#252730]' : isMono ? 'border-[#D8D4CA]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <MingIcon name="game_2_line" size={18} className={iconColor} />
            <h2 className={`text-sm font-bold ${textHeading}`}>Demo Controls</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 transition cursor-pointer ${
              isDark ? 'text-[#8C90A0] hover:bg-[#22242D] hover:text-[#E2E4E9]' : isMono ? 'text-[#78756D] hover:bg-[#E2DFD6] hover:text-[#242321]' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="Hide Demo Controls"
          >
            <MingIcon name="close_line" size={16} />
          </button>
        </div>

        {/* Action Controls List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4">
          {/* Section 0: Sectors API Key & Data Source */}
          <div className={`rounded-2xl border-2 p-3 space-y-2 ${cardContainer}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${textHeading}`}>
                <MingIcon name="key_2_line" size={14} className={iconColor} />
                Data Source & Key
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${
                  isLiveMode
                    ? isDark
                      ? 'bg-[#1E2721] text-[#93C5A5] border-[#2A3F31]'
                      : isMono
                      ? 'bg-[#E2DFD6] text-[#242321] border-[#C8C4B8]'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : isDark
                    ? 'bg-[#1E202B] text-[#8C90A0] border-[#2C2E3A]'
                    : isMono
                    ? 'bg-[#EAE7DF] text-[#78756D] border-[#D8D4CA]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLiveMode
                      ? isDark ? 'bg-[#93C5A5]' : isMono ? 'bg-[#242321]' : 'bg-emerald-500 animate-pulse'
                      : isDark ? 'bg-[#5A5D6E]' : isMono ? 'bg-[#78756D]' : 'bg-slate-400'
                  }`}
                />
                {isLiveMode ? 'Live API v2' : 'Offline Mock'}
              </span>
            </div>

            {/* Input with Masking Toggle */}
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onApiKeyChange?.(e.target.value)}
                placeholder="Enter Sectors API Key..."
                className={`w-full rounded-xl border px-2.5 py-1.5 text-xs focus:outline-none pr-14 font-mono ${
                  isDark
                    ? 'bg-[#14151B] border-[#2C2E3A] text-[#E2E4E9] placeholder:text-[#5A5D6E]'
                    : isMono
                    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321] placeholder:text-[#9E9B93]'
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                }`}
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => onApiKeyChange?.('')}
                    title="Clear API key"
                    className={`p-1 transition ${textMuted}`}
                  >
                    <MingIcon name="close_circle_line" size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide characters' : 'Show characters'}
                  className={`p-1 transition ${textMuted}`}
                >
                  <MingIcon name={showApiKey ? 'eye_close_line' : 'eye_line'} size={14} />
                </button>
              </div>
            </div>

            {/* Security Guarantee Micro-Banner */}
            <div className={`flex items-start gap-1.5 rounded-xl p-2 text-[10px] leading-tight border ${
              isDark
                ? 'bg-[#14151B] border-[#252732] text-[#8C90A0]'
                : isMono
                ? 'bg-[#FCFBF9] border-[#E2DFD6] text-[#78756D]'
                : 'bg-slate-100/80 border-slate-200/60 text-slate-500'
            }`}>
              <MingIcon name="shield_shape_line" size={13} className={`${iconColor} shrink-0 mt-0.5`} />
              <span>
                <strong className={textHeading}>Session only:</strong> Key stays in memory. Never saved to disk or export.
              </span>
            </div>
          </div>

          {/* Section 1: Project File & Starter Presets */}
          <div className={`rounded-2xl border-2 p-3 space-y-2.5 ${cardContainer}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${textHeading}`}>
                <MingIcon name="folder_open_line" size={14} className={iconColor} />
                Project File (.scriffle)
              </span>
            </div>

            {/* Save & Open Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportScriffle}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold border-2 transition-all active:scale-95 cursor-pointer ${subCard}`}
                title="Save current canvas as .scriffle file"
              >
                <MingIcon name="download_2_line" size={14} className={iconColor} />
                <span>Save File</span>
              </button>

              <button
                type="button"
                onClick={() => scriffleInputRef.current?.click()}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold border-2 transition-all active:scale-95 cursor-pointer ${subCard}`}
                title="Open or import .scriffle project file"
              >
                <MingIcon name="folder_open_line" size={14} className={iconColor} />
                <span>Open File</span>
              </button>
            </div>

            {/* Quick Demo Presets */}
            <div className={`pt-1 border-t ${isDark ? 'border-[#252732]' : isMono ? 'border-[#E2DFD6]' : 'border-indigo-100'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${textMuted}`}>
                Load Preset Template:
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onLoadPreset?.('rotation')}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-bold border transition-all active:scale-98 cursor-pointer ${subCard}`}
                >
                  <span className="flex items-center gap-1.5">
                    <MingIcon name="radar_line" size={13} className={iconColor} />
                    <span>Rotation Engine</span>
                  </span>
                  <span className={`text-[10px] font-mono ${textMuted}`}>Complex</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoadPreset?.('momentum')}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-bold border transition-all active:scale-98 cursor-pointer ${subCard}`}
                >
                  <span className="flex items-center gap-1.5">
                    <MingIcon name="rocket_line" size={13} className={iconColor} />
                    <span>Momentum Breakout</span>
                  </span>
                  <span className={`text-[10px] font-mono ${textMuted}`}>Loop</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoadPreset?.('banking')}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-bold border transition-all active:scale-98 cursor-pointer ${subCard}`}
                >
                  <span className="flex items-center gap-1.5">
                    <MingIcon name="building_1_line" size={13} className={iconColor} />
                    <span>Banking Sector Trio</span>
                  </span>
                  <span className={`text-[10px] font-mono ${textMuted}`}>Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Live Market Poll (Real Data or Mock Data) */}
          <div className={`rounded-2xl border-2 p-3 space-y-2.5 ${cardContainer}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${textHeading}`}>
                <MingIcon name="refresh_3_line" size={14} className={iconColor} />
                Market Data Sync
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase ${textMuted}`}>
                {isLiveMode ? 'Live API' : 'Simulated'}
              </span>
            </div>

            <button
              disabled={loading}
              onClick={runLivePoll}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold border-2 transition-all active:scale-98 cursor-pointer ${
                isDark
                  ? 'bg-[#22242D] text-[#E2E4E9] border-[#313442] hover:bg-[#2A2C38]'
                  : isMono
                  ? 'bg-[#E2DFD6] text-[#242321] border-[#C8C4B8] hover:bg-[#D5D1C6]'
                  : isLiveMode
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <MingIcon
                  name={loading ? 'refresh_3_line' : 'radar_line'}
                  size={15}
                  className={`${loading ? 'animate-spin' : ''} ${
                    isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-white'
                  }`}
                />
                <span className={isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-white'}>
                  {isLiveMode ? 'Poll Live Sectors API' : 'Poll Market API (Mock)'}
                </span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isDark ? 'bg-black/40 text-[#BAC0D0]' : isMono ? 'bg-black/10 text-[#242321]' : 'bg-black/20 text-white'
              }`}>
                {isLiveMode ? 'LIVE' : 'MOCK'}
              </span>
            </button>
          </div>

          {/* Section 3: Continuous Auto-Streaming Loop Control */}
          <div className={`rounded-2xl border-2 p-3 space-y-2.5 ${cardContainer}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoTickActive
                      ? isDark ? 'bg-[#93C5A5] animate-ping' : isMono ? 'bg-[#242321] animate-ping' : 'bg-emerald-500 animate-ping'
                      : isDark ? 'bg-[#5A5D6E]' : isMono ? 'bg-[#78756D]' : 'bg-slate-400'
                  }`}
                />
                <span className={`text-[11px] font-bold flex items-center gap-1.5 ${textHeading}`}>
                  <MingIcon name="time_line" size={14} className={iconColor} />
                  Simulated Stream
                </span>
              </div>
              <span className={`text-[10px] font-semibold font-mono ${textMuted}`}>2.5s loop</span>
            </div>

            <button
              type="button"
              onClick={() => onToggleAutoTick?.(!autoTickActive, 2.5)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 border-2 cursor-pointer ${
                autoTickActive
                  ? isDark
                    ? 'bg-[#3A1F26] text-[#E8A5A5] border-[#5A2C37]'
                    : isMono
                    ? 'bg-[#D8D4CA] text-[#242321] border-[#B8B4A8]'
                    : 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                  : isDark
                  ? 'bg-[#1E202B] text-[#D8DAE2] border-[#2C2E3A] hover:bg-[#252734]'
                  : isMono
                  ? 'bg-[#FCFBF9] text-[#242321] border-[#D8D4CA] hover:bg-[#EFECE4]'
                  : 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900'
              }`}
            >
              <MingIcon name={autoTickActive ? 'pause_line' : 'play_line'} size={15} />
              <span>{autoTickActive ? 'Stop Stream' : 'Start Simulated Loop'}</span>
            </button>
          </div>

          {/* Section 4: Manual Preset Spikes & DevTools */}
          <div className={`rounded-2xl border-2 p-3 space-y-2.5 ${cardContainer}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${textHeading}`}>
                <MingIcon name="flash_line" size={14} className={iconColor} />
                Manual Preset Spikes
              </span>
            </div>

            <div className="space-y-1.5">
              {/* Preset 1: BBCA Surge */}
              <button
                disabled={loading}
                onClick={() =>
                  runSimulation('bbca_surge', {
                    symbol: 'BBCA',
                    price: 10850,
                    prevPrice: 10200,
                    price_change: 6.37,
                    volume: 25000000,
                    avg_volume: 10000000,
                    rank: 1,
                  })
                }
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold border transition-all active:scale-98 cursor-pointer ${
                  activePreset === 'bbca_surge'
                    ? isDark ? 'bg-[#2A2C38] text-white border-[#3F4254]' : isMono ? 'bg-[#242321] text-white border-[#242321]' : 'bg-slate-900 text-white border-slate-900'
                    : subCard
                }`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon name="trending_up_line" size={15} className={iconColor} />
                  <span>BBCA Surge (+6.37%)</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${textHeading}`}>+6.4%</span>
              </button>

              {/* Preset 2: BBRI Volume Spike */}
              <button
                disabled={loading}
                onClick={() =>
                  runSimulation('bbri_vol', {
                    symbol: 'BBRI',
                    price: 5400,
                    prevPrice: 5100,
                    price_change: 5.88,
                    volume: 45000000,
                    avg_volume: 18000000,
                    rank: 2,
                  })
                }
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold border transition-all active:scale-98 cursor-pointer ${
                  activePreset === 'bbri_vol'
                    ? isDark ? 'bg-[#2A2C38] text-white border-[#3F4254]' : isMono ? 'bg-[#242321] text-white border-[#242321]' : 'bg-slate-900 text-white border-slate-900'
                    : subCard
                }`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon name="chart_bar_line" size={15} className={iconColor} />
                  <span>BBRI Volume Spike</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${textHeading}`}>45M</span>
              </button>

              {/* Custom 4-Param DevTool Button */}
              <button
                onClick={() => setIsDevToolOpen(true)}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold border transition-all active:scale-98 cursor-pointer ${subCard}`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon
                    name="tools_line"
                    size={15}
                    className={autoTickActive ? `${iconColor} animate-spin` : iconColor}
                  />
                  <span>{autoTickActive ? 'Streaming Active' : 'Custom Spike (DevTool)'}</span>
                </div>
                <MingIcon name="arrow_right_line" size={13} className={textMuted} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* DevTool Modal with Timer Stream Controls */}
      <DevSpikeTool
        isOpen={isDevToolOpen}
        onClose={() => setIsDevToolOpen(false)}
        onInject={(event) => runSimulation('custom_spike', event)}
        autoTickActive={autoTickActive}
        onToggleAutoTick={onToggleAutoTick}
      />
    </>
  );
};
