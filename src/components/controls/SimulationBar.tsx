'use client';

import React, { useState } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { DevSpikeTool } from './DevSpikeTool';

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
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isDevToolOpen, setIsDevToolOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const scriffleInputRef = React.useRef<HTMLInputElement>(null);

  const isLiveMode = Boolean(apiKey && apiKey.trim().length > 0);

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

  return (
    <>
      <aside className="w-72 border-r-2 border-slate-200 bg-white p-4 flex flex-col h-full z-30 transition-all">
        {/* Hidden File Input for .scriffle / .json */}
        <input
          ref={scriffleInputRef}
          type="file"
          accept=".scriffle,.json"
          className="hidden"
          onChange={handleScriffleUpload}
        />

        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
          <div className="flex items-center gap-2">
            <MingIcon name="game_2_line" size={18} className="text-slate-700" />
            <h2 className="text-sm font-bold text-slate-800">Demo Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Hide Demo Controls"
          >
            <MingIcon name="close_line" size={16} />
          </button>
        </div>

        {/* Action Controls List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4">
          {/* Section 0: Sectors API Key & Data Source (With Privacy Guarantee) */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/90 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <MingIcon name="key_2_line" size={14} className="text-slate-600" />
                Data Source & Key
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${
                  isLiveMode
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
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
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none pr-14 shadow-2xs font-mono"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => onApiKeyChange?.('')}
                    title="Clear API key"
                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    <MingIcon name="close_circle_line" size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide characters' : 'Show characters'}
                  className="p-1 text-slate-500 hover:text-slate-800 transition"
                >
                  <MingIcon name={showApiKey ? 'eye_close_line' : 'eye_line'} size={14} />
                </button>
              </div>
            </div>

            {/* Security Guarantee Micro-Banner */}
            <div className="flex items-start gap-1.5 rounded-xl bg-slate-100/80 p-2 text-[10px] text-slate-500 leading-tight border border-slate-200/60">
              <MingIcon name="shield_shape_line" size={13} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-700 font-bold">Session only:</strong> Your key stays in temporary browser memory. Never saved to disk, sent to third parties, or exported in <code className="text-slate-700">.scriffle</code> files.
              </span>
            </div>
          </div>

          {/* Section 1: Project File & Starter Presets */}
          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                <MingIcon name="folder_open_line" size={14} className="text-indigo-600" />
                Project File (.scriffle)
              </span>
            </div>

            {/* Save & Open Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportScriffle}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2.5 py-2 text-xs font-bold text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-50 transition-all active:scale-95 shadow-xs"
                title="Save current canvas as .scriffle file"
              >
                <MingIcon name="download_2_line" size={14} className="text-indigo-600" />
                <span>Save File</span>
              </button>

              <button
                type="button"
                onClick={() => scriffleInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2.5 py-2 text-xs font-bold text-slate-700 border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-xs"
                title="Open or import .scriffle project file"
              >
                <MingIcon name="folder_open_line" size={14} className="text-slate-600" />
                <span>Open File</span>
              </button>
            </div>

            {/* Quick Demo Presets */}
            <div className="pt-1 border-t border-indigo-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1.5">
                Load Preset Template:
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onLoadPreset?.('rotation')}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-2.5 py-1.5 text-left text-xs font-bold text-slate-800 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-98"
                >
                  <span className="flex items-center gap-1.5">
                    <MingIcon name="radar_line" size={13} className="text-emerald-600" />
                    <span>Rotation Engine</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Complex</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoadPreset?.('momentum')}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-2.5 py-1.5 text-left text-xs font-bold text-slate-800 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-98"
                >
                  <span className="flex items-center gap-1.5">
                    <MingIcon name="rocket_line" size={13} className="text-indigo-600" />
                    <span>Momentum Breakout</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Loop</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoadPreset?.('banking')}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-2.5 py-1.5 text-left text-xs font-bold text-slate-800 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-98"
                >
                  <span className="flex items-center gap-1.5">
                    <MingIcon name="building_1_line" size={13} className="text-blue-600" />
                    <span>Banking Sector Trio</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Live Market Poll (Real Data or Mock Data) */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Market Data Sync
            </span>
            <button
              disabled={loading}
              onClick={runLivePoll}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold border-2 transition-all active:scale-98 shadow-xs ${
                isLiveMode
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <MingIcon
                  name={loading ? 'refresh_3_line' : isLiveMode ? 'radar_line' : 'refresh_3_line'}
                  size={16}
                  className={loading ? 'animate-spin text-white' : 'text-white'}
                />
                <span>{isLiveMode ? 'Poll Live Sectors API' : 'Poll Market API (Mock)'}</span>
              </div>
              <span className="text-[10px] opacity-80 font-mono">
                {isLiveMode ? 'LIVE' : 'MOCK'}
              </span>
            </button>
          </div>

          {/* Section 3: Continuous Auto-Streaming Loop Control */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoTickActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-slate-800">Simulated Stream</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Every 2.5s</span>
            </div>

            <button
              type="button"
              onClick={() => onToggleAutoTick?.(!autoTickActive, 2.5)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 shadow-xs ${
                autoTickActive
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              <MingIcon name={autoTickActive ? 'pause_line' : 'play_line'} size={15} />
              <span>{autoTickActive ? 'Stop Stream' : 'Start Simulated Loop'}</span>
            </button>
          </div>

          {/* Section 4: Manual Preset Spikes & DevTools */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Manual Preset Spikes
            </span>
            <div className="space-y-2">
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
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold border-2 transition-all active:scale-98 ${
                  activePreset === 'bbca_surge'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon name="trending_up_line" size={16} className="text-emerald-600" />
                  <span>BBCA Surge (+6.37%)</span>
                </div>
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
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold border-2 transition-all active:scale-98 ${
                  activePreset === 'bbri_vol'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon name="chart_bar_line" size={16} className="text-purple-600" />
                  <span>BBRI Volume Spike</span>
                </div>
              </button>

              {/* Custom 4-Param DevTool Button */}
              <button
                onClick={() => setIsDevToolOpen(true)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold border-2 transition-all active:scale-98 ${
                  autoTickActive
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon
                    name="tools_line"
                    size={15}
                    className={autoTickActive ? 'text-emerald-600 animate-spin' : 'text-slate-700'}
                  />
                  <span>{autoTickActive ? 'Streaming Active' : 'Custom Spike (DevTool)'}</span>
                </div>
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
