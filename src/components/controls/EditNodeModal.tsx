'use client';

import React, { useState, useEffect } from 'react';
import { CanvasNodeData } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme } = useTheme();
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

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const modalBg = isDark
    ? 'bg-[#14151B] border-[#282A36] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  const headerBorder = isDark ? 'border-[#252730]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-100';

  const inputBg = isDark
    ? 'bg-[#191A22] border-[#2C2E3A] text-[#E2E4E9] focus:border-[#8E95A5]'
    : isMono
    ? 'bg-[#F4F3EF] border-[#D8D4CA] text-[#242321] focus:border-[#78756D]'
    : 'border-slate-200 text-slate-900 focus:border-slate-800';

  const labelColor = isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-700';
  const secondaryColor = isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-none transition-colors ${modalBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${headerBorder}`}>
          <div className="flex items-center gap-2">
            <MingIcon name="edit_line" size={20} className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-700'} />
            <h2 className={`text-base font-bold ${isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'}`}>
              Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition cursor-pointer ${
              isDark ? 'text-[#8C90A0] hover:bg-[#22242D] hover:text-[#E2E4E9]' : isMono ? 'text-[#78756D] hover:bg-[#EFECE4] hover:text-[#242321]' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <MingIcon name="close_line" size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4 text-xs">
          {node.type === 'watcher' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Stock Ticker Symbol</label>
                <input
                  type="text"
                  value={config.symbol || ''}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g. BBCA, BBRI, BMRI, TLKM"
                  className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-bold block ${labelColor}`}>Polling Interval (Seconds)</label>
                  <span className={`text-[10px] font-mono ${secondaryColor}`}>Display cadence</span>
                </div>
                <input
                  type="number"
                  min={5}
                  max={3600}
                  value={config.interval || 300}
                  onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 300 })}
                  className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                />
                <div className={`mt-1.5 rounded-lg p-2 text-[11px] leading-relaxed border ${
                  isDark ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]' : isMono ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  💡 <strong>How polling works:</strong> Scriffle tracks data via live Sectors API requests. Manual polls sync immediately, or you can run continuous stream simulations.
                </div>
              </div>
            </>
          )}

          {node.type === 'condition' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Condition Rule Expression</label>
                <input
                  type="text"
                  value={config.rule || ''}
                  onChange={(e) => setConfig({ ...config, rule: e.target.value })}
                  placeholder="e.g. price_change > 5 AND volume > 1000000"
                  className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                />
              </div>
              <div className={`rounded-xl p-3 border space-y-1 ${
                isDark ? 'bg-[#191A22] border-[#252732]' : isMono ? 'bg-[#F4F3EF] border-[#E2DFD6]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-bold block ${isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-700'}`}>Available Variables:</span>
                <p className={`text-[11px] leading-relaxed ${secondaryColor}`}>
                  <code className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-800'}>price</code>,{' '}
                  <code className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-800'}>price_change</code> (%),{' '}
                  <code className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-800'}>volume</code>,{' '}
                  <code className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-800'}>avg_volume</code>,{' '}
                  <code className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-800'}>rank</code>
                </p>
              </div>
            </>
          )}

          {node.type === 'note' && (
            <div>
              <label className={`font-bold block mb-1 ${labelColor}`}>Sticky Note Content</label>
              <textarea
                value={config.content || ''}
                onChange={(e) => setConfig({ ...config, content: e.target.value })}
                rows={4}
                placeholder="Enter note text..."
                className={`w-full rounded-xl border-2 p-2.5 font-medium leading-relaxed focus:outline-none ${inputBg}`}
              />
            </div>
          )}

          {node.type === 'text' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Text Label</label>
                <input
                  type="text"
                  value={config.text || ''}
                  onChange={(e) => setConfig({ ...config, text: e.target.value })}
                  placeholder="Enter text..."
                  className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Font Size</label>
                <select
                  value={config.fontSize || 'medium'}
                  onChange={(e) => setConfig({ ...config, fontSize: e.target.value })}
                  className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                >
                  <option value="small">Small (12px)</option>
                  <option value="medium">Medium (14px)</option>
                  <option value="large">Large (20px Header)</option>
                </select>
              </div>
            </>
          )}

          {node.type === 'alert' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Notification Channel</label>
                <select
                  value={config.channel || 'ui'}
                  onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                  className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                >
                  <option value="ui">UI Toast (In-App)</option>
                  <option value="telegram">Telegram Bot (Webhook)</option>
                  <option value="webhook">Custom HTTP Endpoint</option>
                </select>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Custom Toast Message Template</label>
                <input
                  type="text"
                  value={config.template || ''}
                  onChange={(e) => setConfig({ ...config, template: e.target.value })}
                  placeholder="e.g. 🚀 ${symbol} Breakout: +${price_change}% at Rp${price}"
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
                <span className={`text-[11px] block mt-1 ${secondaryColor}`}>
                  Variables: ${'{symbol}'}, ${'{price}'}, ${'{price_change}'}, ${'{volume}'}, ${'{timestamp}'}
                </span>
              </div>
            </>
          )}

          {node.type === 'action' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Automated Action Type</label>
                <select
                  value={config.action || 'create_note'}
                  onChange={(e) => setConfig({ ...config, action: e.target.value })}
                  className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                >
                  <option value="create_note">Auto-Spawn Research Note</option>
                  <option value="create_watcher">Auto-Spawn Peer Watcher</option>
                </select>
              </div>

              {config.action === 'create_watcher' ? (
                <div>
                  <label className={`font-bold block mb-1 ${labelColor}`}>Target Stock Symbol to Spawn</label>
                  <input
                    type="text"
                    value={config.targetSymbol || config.params?.symbol || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targetSymbol: e.target.value.toUpperCase(),
                        params: { ...config.params, symbol: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="e.g. BBRI, BMRI, TLKM"
                    className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                  />
                </div>
              ) : (
                <div>
                  <label className={`font-bold block mb-1 ${labelColor}`}>Dynamic Note Template</label>
                  <textarea
                    value={config.noteTemplate || ''}
                    onChange={(e) => setConfig({ ...config, noteTemplate: e.target.value })}
                    rows={3}
                    placeholder="e.g. 📈 ${symbol} Thesis Triggered at Rp${price} (${timestamp})"
                    className={`w-full rounded-xl border-2 p-2.5 font-medium leading-relaxed focus:outline-none ${inputBg}`}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`mt-6 flex justify-end gap-2 border-t pt-4 ${headerBorder}`}>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border-2 px-4 py-2 font-bold transition cursor-pointer ${
              isDark
                ? 'border-[#2C2E3A] bg-[#181920] text-[#BAC0D0] hover:bg-[#22242D]'
                : isMono
                ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#242321] hover:bg-[#EAE7DF]'
                : 'border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`rounded-xl px-4 py-2 font-bold transition active:scale-95 cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#BAC0D0] text-[#0F1014] hover:bg-white'
                : isMono
                ? 'bg-[#0050FF] text-white hover:bg-[#0040D0]'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
