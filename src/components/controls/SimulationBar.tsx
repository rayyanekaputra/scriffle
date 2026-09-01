'use client';

import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, Zap, TrendingUp, BarChart2 } from 'lucide-react';

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
      <div className="flex items-center gap-1.5 px-3 border-r border-slate-700 text-xs font-semibold text-slate-300">
        <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
        <span>Demo Simulator</span>
      </div>

      {/* Preset 1: BBCA Breakout Surge */}
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
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
          activePreset === 'bbca_surge'
            ? 'bg-emerald-500 text-slate-950 scale-95'
            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
        }`}
      >
        <TrendingUp className="h-3.5 w-3.5" />
        <span>BBCA Surge (+6.37%)</span>
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
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
          activePreset === 'bbri_vol'
            ? 'bg-purple-500 text-slate-950 scale-95'
            : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
        }`}
      >
        <BarChart2 className="h-3.5 w-3.5" />
        <span>BBRI Volume Spike</span>
      </button>

      {/* Live Sectors API Poll */}
      <button
        disabled={loading}
        onClick={runLivePoll}
        className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
        <span>Poll Market Data</span>
      </button>
    </div>
  );
};
