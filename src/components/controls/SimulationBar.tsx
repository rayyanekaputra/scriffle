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
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  isOpen,
  onClose,
  onSimulateSuccess,
  onSimulateCustom,
  autoTickActive = false,
  onToggleAutoTick,
}) => {
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isDevToolOpen, setIsDevToolOpen] = useState(false);

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
      const res = await fetch('/api/engine/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        onSimulateSuccess?.();
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
          {/* Continuous Auto-Streaming Loop Control */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${autoTickActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                <span className="text-[11px] font-bold text-slate-800">Live Continuous Stream</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Every 2.5s</span>
            </div>

            <button
              type="button"
              onClick={() => onToggleAutoTick?.(!autoTickActive, 2.5)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 shadow-xs ${
                autoTickActive
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <MingIcon name={autoTickActive ? 'pause_line' : 'play_line'} size={15} />
              <span>{autoTickActive ? 'Stop Continuous Loop' : 'Start Continuous Loop'}</span>
            </button>
          </div>

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
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Advanced Tools
            </span>
            <div className="space-y-2">
              {/* Custom 4-Param DevTool Button */}
              <button
                onClick={() => setIsDevToolOpen(true)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold border-2 transition-all active:scale-98 ${
                  autoTickActive
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MingIcon
                    name="tools_line"
                    size={16}
                    className={autoTickActive ? 'text-emerald-600 animate-spin' : 'text-slate-700'}
                  />
                  <span>{autoTickActive ? 'Streaming Active' : 'Custom Spike (DevTool)'}</span>
                </div>
              </button>

              {/* Live Market Poll */}
              <button
                disabled={loading}
                onClick={runLivePoll}
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <MingIcon
                    name="refresh_3_line"
                    size={16}
                    className={loading ? 'animate-spin text-slate-600' : 'text-slate-600'}
                  />
                  <span>Poll Market API</span>
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
