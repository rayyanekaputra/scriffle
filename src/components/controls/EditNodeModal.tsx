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
                <label className={`font-bold block mb-1 ${labelColor}`}>Watcher Type / Mode</label>
                <select
                  value={config.mode || 'single'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mode: e.target.value,
                      symbol:
                        e.target.value === 'top_gainers'
                          ? 'Top Gainers'
                          : e.target.value === 'top_losers'
                          ? 'Top Losers'
                          : config.symbol === 'TOP_GAINERS' || config.symbol === 'Top Gainers' || config.symbol === 'TOP_LOSERS' || config.symbol === 'Top Losers'
                          ? 'BBCA'
                          : config.symbol || 'BBCA',
                    })
                  }
                  className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                >
                  <option value="single">Single Stock Ticker (e.g. BBCA, TLKM)</option>
                  <option value="top_gainers">🚀 Top Gainers Radar (Sectors API Leaderboard)</option>
                  <option value="top_losers">🔻 Top Losers Radar (Sectors API Leaderboard)</option>
                </select>
              </div>

              {config.mode === 'single' || !config.mode ? (
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
              ) : (
                <>
                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>Leaderboard Size (Top N Movers)</label>
                    <select
                      value={config.limit || 5}
                      onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) || 5 })}
                      className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                    >
                      <option value="1">Top 1 Mover</option>
                      <option value="3">Top 3 Movers</option>
                      <option value="5">Top 5 Movers</option>
                      <option value="10">Top 10 Movers</option>
                      <option value="20">Top 20 Movers</option>
                    </select>
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>Time Period</label>
                    <select
                      value={config.period || '1d'}
                      onChange={(e) => setConfig({ ...config, period: e.target.value as any })}
                      className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                    >
                      <option value="1d">1 Day (Daily Gainers / Losers)</option>
                      <option value="7d">7 Days (Weekly)</option>
                      <option value="14d">14 Days (Bi-Weekly)</option>
                      <option value="30d">30 Days (Monthly)</option>
                      <option value="365d">365 Days (1 Year)</option>
                      <option value="all">All Periods Combined</option>
                    </select>
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>Min Market Cap Filter (Billion IDR)</label>
                    <input
                      type="number"
                      value={config.minMcapBillion || ''}
                      onChange={(e) => setConfig({ ...config, minMcapBillion: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="e.g. 5000 for IDR 5 Trillion"
                      className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                    />
                    <span className={`text-[11px] block mt-1 ${secondaryColor}`}>
                      Optional: Only include companies with market cap above this threshold (in Billion IDR).
                    </span>
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>Minimum % Move Filter</label>
                    <input
                      type="number"
                      value={config.threshold || 0}
                      onChange={(e) => setConfig({ ...config, threshold: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 5 for +5.0%"
                      className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                    >
                    </input>
                    <span className={`text-[11px] block mt-1 ${secondaryColor}`}>
                      Filter movers with at least this percentage move before triggering downstream flow.
                    </span>
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-bold block ${labelColor}`}>Polling Interval (Seconds)</label>
                  <span className={`text-[10px] font-mono ${secondaryColor}`}>Display cadence</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={config.interval || 300}
                  onChange={(e) => setConfig({ ...config, interval: Math.max(1, parseInt(e.target.value) || 1) })}
                  className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                />
                <div className={`mt-1.5 rounded-lg p-2 text-[11px] leading-relaxed border ${
                  isDark ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]' : isMono ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  💡 <strong>Per-Node Cadence:</strong> When Auto-Polling is started, this Watcher will poll every <strong>{config.interval || 300}s</strong> independently using the live Sectors API.
                </div>
              </div>
            </>
          )}

          {node.type === 'screener' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Natural Language Query Prompt</label>
                <textarea
                  value={config.query || ''}
                  onChange={(e) => setConfig({ ...config, query: e.target.value })}
                  rows={3}
                  placeholder="e.g. top 5 banks by market cap, mining stocks with high dividend..."
                  className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <span className={`font-bold block mb-1 text-[11px] ${secondaryColor}`}>Preset Query Prompts</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Top 5 banks by market cap',
                    'Top 5 tech companies by market cap',
                    'Coal mining companies with high dividend',
                    'Consumer goods companies with high ROE',
                    'Undervalued stocks with PE < 10',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setConfig({ ...config, query: preset })}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition cursor-pointer ${
                        config.query === preset
                          ? 'bg-[#0050FF] text-white border-[#0050FF]'
                          : isDark
                          ? 'bg-[#1C1E26] border-[#292B38] text-[#BAC0D0] hover:border-[#383B4A]'
                          : isMono
                          ? 'bg-[#F4F3EF] border-[#D8D4CA] text-[#242321] hover:border-[#B5B0A2]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`font-bold block mb-1 ${labelColor}`}>Max Results Limit</label>
                  <select
                    value={config.limit || 5}
                    onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value, 10) })}
                    className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                  >
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                </div>

                <div>
                  <label className={`font-bold block mb-1 ${labelColor}`}>Re-screen Interval</label>
                  <select
                    value={config.interval || 300}
                    onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value, 10) })}
                    className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                  >
                    <option value={60}>Every 1 min</option>
                    <option value={300}>Every 5 mins</option>
                    <option value={900}>Every 15 mins</option>
                    <option value={3600}>Every 1 hour</option>
                  </select>
                </div>
              </div>

              <div className={`rounded-xl p-3 border space-y-1.5 ${
                isDark ? 'bg-[#191A22] border-[#252732]' : isMono ? 'bg-[#F4F3EF] border-[#E2DFD6]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0050FF]">
                    <MingIcon name="sparkles_line" size={14} />
                    <span>Sectors API v2 /companies/</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isDark
                      ? 'bg-[#20222B] text-amber-400 border-amber-400/20'
                      : isMono
                      ? 'bg-[#ECE8DE] text-amber-700 border-amber-600/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <MingIcon name="coin_line" size={11} />
                    3 AI credits / query
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${secondaryColor}`}>
                  Uses Sectors.app AI Natural Language engine to dynamically resolve ticker filters, metric sorting, and financial ratios. Each execution consumes 3 AI token credits.
                </p>
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
                  <option value="create_note">➕ Auto-Spawn New Sticky Note (Generates new card)</option>
                  <option value="fundamental_report">📊 Generate Fundamental Report & PDF (Sectors API)</option>
                  <option value="create_watcher">⚡ Auto-Spawn Peer Watcher</option>
                </select>
                <div className={`mt-2 rounded-xl p-2.5 text-[11px] leading-relaxed border ${
                  isDark ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]' : isMono ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  💡 <strong>Tip:</strong> If you want an <em>existing</em> sticky note to simply update in-place on every tick, connect your Watcher or Condition directly to that <strong>Sticky Note</strong> node instead of an Action node!
                </div>
              </div>

              {config.action === 'create_watcher' ? (
                <div className="space-y-3">
                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>Target Stock Symbol (Optional Override)</label>
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
                      placeholder="Leave empty to auto-track incoming tickers dynamically"
                      className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                    />
                  </div>
                  <div className={`rounded-xl p-3 text-xs leading-relaxed border ${
                    isDark
                      ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]'
                      : isMono
                      ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    ⚡ <strong>Dynamic Watcher Spawning:</strong> By default, this action automatically spawns dedicated Watcher cards on the canvas for each incoming top gainer/loser ticker (with 300s polling interval).
                  </div>
                </div>
              ) : config.action === 'fundamental_report' ? (
                <div className={`rounded-xl p-3 text-xs leading-relaxed border ${
                  isDark
                    ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]'
                    : isMono
                    ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  📊 <strong>Multi-Symbol Automated Sectors Brief:</strong> When triggered by Top Gainers/Losers or single breakout events, Scriffle fetches fundamentals from <code>/v2/company/report/{'${symbol}'}/</code> for <strong>each outputted ticker</strong>, generating structured research notes and auto-saved PDF briefs.
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

          {node.type === 'file' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>File Name</label>
                <input
                  type="text"
                  value={config.fileName || ''}
                  onChange={(e) => setConfig({ ...config, fileName: e.target.value })}
                  placeholder="e.g. BBCA_Research_Report.pdf"
                  className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>File URL / Direct Link</label>
                <input
                  type="text"
                  value={config.fileUrl || ''}
                  onChange={(e) => setConfig({ ...config, fileUrl: e.target.value })}
                  placeholder="e.g. https://... or /exports/report.pdf"
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Local Disk Path (Open Location)</label>
                <input
                  type="text"
                  value={config.filePath || ''}
                  onChange={(e) => setConfig({ ...config, filePath: e.target.value })}
                  placeholder="e.g. /home/user/Downloads/report.pdf or C:\Reports\report.pdf"
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`font-bold block mb-1 ${labelColor}`}>Category</label>
                  <select
                    value={config.fileCategory || 'pdf'}
                    onChange={(e) => setConfig({ ...config, fileCategory: e.target.value })}
                    className={`w-full rounded-xl border-2 p-2.5 font-semibold focus:outline-none ${inputBg}`}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="presentation">Presentation / Slides</option>
                    <option value="document">Word / Text Document</option>
                    <option value="spreadsheet">Spreadsheet / CSV</option>
                    <option value="audio">Music / Audio</option>
                    <option value="code">Code / JSON</option>
                    <option value="archive">Archive / ZIP</option>
                    <option value="generic">Other / Generic</option>
                  </select>
                </div>

                <div>
                  <label className={`font-bold block mb-1 ${labelColor}`}>File Size</label>
                  <input
                    type="text"
                    value={config.fileSize || ''}
                    onChange={(e) => setConfig({ ...config, fileSize: e.target.value })}
                    placeholder="e.g. 1.8 MB"
                    className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Caption (Optional)</label>
                <input
                  type="text"
                  value={config.caption || ''}
                  onChange={(e) => setConfig({ ...config, caption: e.target.value })}
                  placeholder="e.g. Generated during morning breakout scan"
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
              </div>
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
