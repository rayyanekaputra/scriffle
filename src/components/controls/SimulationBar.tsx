'use client';

import React, { useState } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';

interface SimulationBarProps {
  onSimulateSuccess?: () => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({ onSimulateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const runSimulation = async (presetName: string, eventPayload: any) => {
    setLoading(true);
    setActivePreset(presetName);
    try {
      const res = await fetch('/api/engine/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventPayload }),
      });
      if (res.ok) {
        onSimulateSuccess?.();
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border-2 border-slate-300 bg-white p-2">
      <div className="flex items-center gap-1.5 px-3 border-r-2 border-slate-200 text-xs font-bold text-slate-700">
        <MingIcon name="game_2_line" size={18} className="text-[#0050FF]" />
        <span>Demo Controls</span>
      </div>

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
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border-2 transition-all active:scale-95 ${
          activePreset === 'bbca_surge'
            ? 'bg-[#0050FF] text-white border-[#0050FF] scale-95'
            : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
        }`}
      >
        <MingIcon name="trending_up_line" size={16} />
        <span>Simulate BBCA Surge (+6.37%)</span>
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
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border-2 transition-all active:scale-95 ${
          activePreset === 'bbri_vol'
            ? 'bg-[#0050FF] text-white border-[#0050FF] scale-95'
            : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
        }`}
      >
        <MingIcon name="chart_bar_line" size={16} />
        <span>Simulate BBRI Volume Spike</span>
      </button>

      {/* Live Market Poll */}
      <button
        disabled={loading}
        onClick={runLivePoll}
        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 border-2 border-slate-300 hover:bg-slate-200 transition-all active:scale-95"
      >
        <MingIcon name="refresh_3_line" size={16} className={loading ? 'animate-spin text-[#0050FF]' : ''} />
        <span>Poll Market Data</span>
      </button>
    </div>
  );
};
