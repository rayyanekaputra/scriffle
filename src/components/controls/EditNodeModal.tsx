'use client';

import React, { useState, useEffect } from 'react';
import { CanvasNodeData } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

interface EditNodeModalProps {
  node: CanvasNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedConfig: any) => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (node?.config) {
      setConfig({ ...node.config });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-slate-300 bg-white p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MingIcon name="edit_line" size={20} className="text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4 text-xs">
          {node.type === 'watcher' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stock Ticker Symbol</label>
                <input
                  type="text"
                  value={config.symbol || ''}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g. BBCA, BBRI, BMRI, TLKM"
                  className="w-full rounded-xl border-2 border-slate-200 p-2.5 font-bold text-slate-900 focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Polling Interval (seconds)</label>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono">
                    {config.interval ? `${config.interval}s (${(config.interval / 60).toFixed(1)}m)` : '300s (5.0m)'}
                  </span>
                </div>
                <input
                  type="number"
                  min={5}
                  max={86400}
                  value={config.interval || 300}
                  onChange={(e) => setConfig({ ...config, interval: Number(e.target.value) })}
                  className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none"
                />

                {/* Explanation Card */}
                <div className="mt-2 rounded-xl bg-blue-50/70 p-2.5 border border-blue-200/70 text-[11px] text-blue-900 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <MingIcon name="time_line" size={13} className="text-[#0050FF]" />
                    <span>What is Polling Interval?</span>
                  </div>
                  <p className="text-slate-600 text-[10px]">
                    How often this card requests new market snapshot data from the <strong>Sectors API</strong> (e.g. every 300s = 5 minutes). Higher intervals save API rate limits, while shorter intervals provide faster alerts.
                  </p>
                </div>
              </div>
            </>
          )}

          {node.type === 'condition' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Condition Rule (DSL)</label>
              <input
                type="text"
                value={config.rule || ''}
                onChange={(e) => setConfig({ ...config, rule: e.target.value })}
                placeholder="e.g. price_change > 5 AND volume > 1000000"
                className="w-full rounded-xl border-2 border-slate-200 p-2.5 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Variables: price, price_change, volume, avg_volume, rank.
              </p>
            </div>
          )}

          {node.type === 'note' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Note Content (Markdown & Text)</label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {(config.content || '').length} chars • {(config.content || '').trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={config.content || ''}
                  onChange={(e) => setConfig({ ...config, content: e.target.value })}
                  placeholder="Write your research notes, findings, or template..."
                  className="w-full rounded-2xl border-2 border-slate-200 p-3 text-slate-900 focus:border-slate-800 focus:outline-none leading-relaxed text-xs"
                />
              </div>

              {/* Quick Template Tokens */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Insert Dynamic Variable</label>
                <div className="flex flex-wrap gap-1.5">
                  {['${symbol}', '${price}', '${price_change}', '${volume}', '${timestamp}'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          content: (config.content || '') + (config.content ? ' ' : '') + token,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                    >
                      + {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Color Palette */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Color Theme</label>
                <div className="flex gap-2">
                  {(['yellow', 'mint', 'pink', 'blue', 'purple'] as const).map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setConfig({ ...config, color: col })}
                      className={`h-8 w-8 rounded-xl border-2 transition ${
                        (config.color || 'yellow') === col ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                      } ${
                        col === 'yellow'
                          ? 'bg-amber-300'
                          : col === 'mint'
                          ? 'bg-emerald-300'
                          : col === 'pink'
                          ? 'bg-rose-300'
                          : col === 'blue'
                          ? 'bg-sky-300'
                          : 'bg-purple-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Canvas Dimensions & Reset */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Size: {config.width ? `${config.width}px` : 'Default (288px)'} × {config.height ? `${config.height}px` : 'Auto'}
                </span>
                {(config.width || config.height) && (
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, width: undefined, height: undefined })}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Reset to auto size
                  </button>
                )}
              </div>
            </>
          )}

          {node.type === 'text' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Freeform Text</label>
              <textarea
                rows={3}
                value={config.text || ''}
                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>
          )}

          {node.type === 'alert' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Alert Channel</label>
              <select
                value={config.channel || 'ui'}
                onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-medium"
              >
                <option value="ui">UI Toast Notification</option>
                <option value="telegram">Telegram Dispatch</option>
                <option value="webhook">Webhook Endpoint</option>
              </select>
            </div>
          )}

          {node.type === 'action' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mutation Action</label>
              <select
                value={config.action || 'create_note'}
                onChange={(e) => setConfig({ ...config, action: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-medium"
              >
                <option value="create_note">Create Child Sticky Note</option>
                <option value="create_watcher">Spawn Related Watcher</option>
                <option value="export_canvas">Snapshot Export</option>
              </select>
            </div>
          )}
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
            onClick={handleSave}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
