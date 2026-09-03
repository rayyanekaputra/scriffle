'use client';

import React, { useState } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';

interface DevSpikeToolProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (event: any) => void;
}

export const DevSpikeTool: React.FC<DevSpikeToolProps> = ({ isOpen, onClose, onInject }) => {
  const [symbol, setSymbol] = useState('TLKM');
  const [price, setPrice] = useState(3250);
  const [priceChange, setPriceChange] = useState(6.5);
  const [volume, setVolume] = useState(25000000);
  const [avgVolume, setAvgVolume] = useState(10000000);
  const [rank, setRank] = useState(3);

  if (!isOpen) return null;

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

  const applyPreset = (sym: string, chg: number, vol: number, avgVol: number, p: number, r: number) => {
    setSymbol(sym);
    setPriceChange(chg);
    setVolume(vol);
    setAvgVolume(avgVol);
    setPrice(p);
    setRank(r);
  };

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
              <h3 className="text-sm font-bold text-slate-900">Developer Market Spike Tool</h3>
              <p className="text-[11px] text-slate-500">Inject custom numbers to test complex condition formulas</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Presets Row */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
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
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
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
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInject}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95"
          >
            <MingIcon name="flash_line" size={16} />
            <span>Inject Custom Tick</span>
          </button>
        </div>
      </div>
    </div>
  );
};
