'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';

interface DevSpikeToolProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (event: any) => void;
  autoTickActive?: boolean;
  onToggleAutoTick?: (active: boolean, intervalSec: number) => void;
}

export const DevSpikeTool: React.FC<DevSpikeToolProps> = ({
  isOpen,
  onClose,
  onInject,
  autoTickActive = false,
  onToggleAutoTick,
}) => {
  const [symbol, setSymbol] = useState('TLKM');
  const [price, setPrice] = useState(3250);
  const [priceChange, setPriceChange] = useState(6.5);
  const [volume, setVolume] = useState(25000000);
  const [avgVolume, setAvgVolume] = useState(10000000);
  const [rank, setRank] = useState(3);

  // Auto-Ticker Timer Controls
  const [timerInterval, setTimerInterval] = useState(3); // in seconds
  const [isAutoRunning, setIsAutoRunning] = useState(autoTickActive);
  const [randomJitter, setRandomJitter] = useState(true);

  useEffect(() => {
    setIsAutoRunning(autoTickActive);
  }, [autoTickActive]);

  const handleInject = () => {
    onInject({
      symbol: symbol.toUpperCase().trim(),
      price: Number(price),
      prevPrice: Number(price) / (1 + Number(priceChange) / 100),
      price_change: Number(priceChange),
      volume: Number(volume),
      avg_volume: Number(avgVolume),
      rank: Number(rank),
      timestamp: new Date().toLocaleTimeString(),
    });
    onClose();
  };

  const handleToggleTimer = () => {
    const nextState = !isAutoRunning;
    setIsAutoRunning(nextState);
    onToggleAutoTick?.(nextState, timerInterval);
  };

  const applyPreset = (sym: string, chg: number, vol: number, avgVol: number, p: number, r: number) => {
    setSymbol(sym);
    setPriceChange(chg);
    setVolume(vol);
    setAvgVolume(avgVol);
    setPrice(p);
    setRank(r);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl border-2 border-slate-300 bg-white p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-slate-100 p-1.5 text-slate-800 border border-slate-200">
              <MingIcon name="tools_line" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Developer Market Spike & Auto-Ticker Tool</h3>
              <p className="text-[11px] text-slate-500">Inject custom numbers or stream live changing market ticks</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Continuous Auto-Ticker Stream Section */}
        <div className="mt-3 rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isAutoRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Auto-Stream Market Ticks (Timer)</h4>
                <p className="text-[10px] text-slate-500">Continuously mimics live market API updates</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTimer}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                isAutoRunning
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <MingIcon name={isAutoRunning ? 'pause_line' : 'play_line'} size={14} />
              <span>{isAutoRunning ? 'Stop Streaming' : 'Start Streaming'}</span>
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span>Interval:</span>
              <select
                value={timerInterval}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTimerInterval(val);
                  if (isAutoRunning) onToggleAutoTick?.(true, val);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-800 focus:outline-none"
              >
                <option value={1}>Every 1 sec (Fast)</option>
                <option value={2}>Every 2 sec</option>
                <option value={3}>Every 3 sec (Recommended)</option>
                <option value={5}>Every 5 sec</option>
              </select>
            </div>

            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={randomJitter}
                onChange={(e) => setRandomJitter(e.target.checked)}
                className="rounded text-slate-900"
              />
              <span>Realistic Volatility Jitter</span>
            </label>
          </div>
        </div>

        {/* Presets Row */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('TLKM', 8.2, 35000000, 10000000, 3400, 2)}
            className="rounded-xl bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0"
          >
            🚀 TLKM Breakout (+8.2%)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('BMRI', 4.5, 45000000, 15000000, 7100, 1)}
            className="rounded-xl bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0"
          >
            📊 BMRI Heavy Vol (3x)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('BBCA', -5.4, 28000000, 12000000, 9700, 4)}
            className="rounded-xl bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 shrink-0"
          >
            📉 BBCA Dump (-5.4%)
          </button>
        </div>

        {/* 4 Core Parameter Inputs */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 text-xs">
          {/* Param 1: Symbol */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">1. Stock Ticker (symbol)</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. TLKM, BBCA, BMRI"
              className="w-full rounded-xl border-2 border-slate-200 p-2.5 font-bold text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Param 2: Price Change % */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">2. Price Change % (price_change)</label>
            <input
              type="number"
              step="0.1"
              value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              placeholder="e.g. 6.5"
              className="w-full rounded-xl border-2 border-slate-200 p-2.5 font-bold text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Param 3: Trading Volume */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">3. Current Volume (volume)</label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Param 4: Average Volume */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">4. Avg Volume (avg_volume)</label>
            <input
              type="number"
              value={avgVolume}
              onChange={(e) => setAvgVolume(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Optional: Market Price */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Price (IDR)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Optional: Sector Rank */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Sector Rank (rank)</label>
            <input
              type="number"
              value={rank}
              onChange={(e) => setRank(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleInject}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95"
          >
            <MingIcon name="flash_line" size={16} />
            <span>Inject Single Tick</span>
          </button>
        </div>
      </div>
    </div>
  );
};
