'use client';

import React, { useState, useEffect } from 'react';
import { CanvasNodeData } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';
import { CompanyCombobox } from '@/components/ui/CompanyCombobox';

interface EditNodeModalProps {
  node: CanvasNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedConfig: any) => void;
  onOpenScreener?: () => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onOpenScreener,
}) => {
  const { theme } = useTheme();
  const [config, setConfig] = useState<any>({});
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (node?.config) {
      setConfig({ ...node.config });
      setTestWebhookResult(null);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleTestDiscordWebhook = async () => {
    if (!config.discordWebhookUrl) {
      setTestWebhookResult({
        success: false,
        message: 'Please enter a Discord Webhook URL before testing.',
      });
      return;
    }

    setTestingWebhook(true);
    setTestWebhookResult(null);

    try {
      const res = await fetch('/api/alert/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'discord',
          webhookUrl: config.discordWebhookUrl,
          template: config.template || config.messageTemplate,
          botName: config.botName,
          includeMarketStats: config.includeMarketStats !== false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestWebhookResult({
          success: true,
          message: data.message || 'Test alert delivered to Discord channel successfully!',
        });
      } else {
        setTestWebhookResult({
          success: false,
          message: data.error || 'Failed to deliver test alert to Discord.',
        });
      }
    } catch (err: any) {
      setTestWebhookResult({
        success: false,
        message: err.message || 'Network error while testing webhook.',
      });
    } finally {
      setTestingWebhook(false);
    }
  };

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
      <div className={`flex flex-col w-full max-w-md max-h-[88vh] rounded-3xl border-2 shadow-none overflow-hidden transition-colors ${modalBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${headerBorder}`}>
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
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 text-xs">
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
                          ? ''
                          : config.symbol || '',
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
                  <label className={`font-bold block mb-1 ${labelColor}`}>Stock Ticker / Company</label>
                  <CompanyCombobox
                    value={config.symbol || ''}
                    onChange={(sym) => setConfig({ ...config, symbol: sym })}
                    onOpenScreener={onOpenScreener}
                    placeholder="Search company or ticker (e.g. BBCA, Mandiri)"
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

                <div className={`mt-2 rounded-xl p-3 border space-y-1 ${
                  isDark ? 'bg-[#191A22] border-[#252732]' : isMono ? 'bg-[#F4F3EF] border-[#E2DFD6]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-[#0050FF] flex items-center gap-1">
                      <MingIcon name="coin_line" size={13} />
                      Sectors API Credit Rate
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      config.mode === 'top_gainers' || config.mode === 'top_losers'
                        ? isDark ? 'bg-[#20222B] text-amber-400 border-amber-400/20' : isMono ? 'bg-[#ECE8DE] text-amber-700 border-amber-600/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                        : isDark ? 'bg-[#20222B] text-[#BAC0D0] border-[#2F3240]' : isMono ? 'bg-[#ECE8DE] text-[#5A5852] border-[#D6D0C2]' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {config.mode === 'top_gainers' || config.mode === 'top_losers' ? '10 credits / poll' : '1 credit / tick'}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${secondaryColor}`}>
                    {config.mode === 'top_gainers' || config.mode === 'top_losers'
                      ? 'Calls /v2/companies/top-changes/. Costs 1 API credit per requested classification × period combination (default 2 classifications × 5 periods = 10 credits / poll).'
                      : 'Calls /v2/daily/{symbol}/ to poll latest price and volume. Consumes 1 credit per symbol tick.'}
                  </p>
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

          {node.type === 'sticker' && (
            <>
              {/* Sticker Preview Badge */}
              <div>
                <label className={`font-bold block mb-1.5 ${labelColor}`}>Live Sticker Preview</label>
                <div className="flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#282A36]">
                  <div className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2 font-bold text-xs transition-all ${
                    config.color === 'green' ? 'bg-emerald-100 border-emerald-400 text-emerald-900' :
                    config.color === 'red' ? 'bg-rose-100 border-rose-400 text-rose-900' :
                    config.color === 'amber' ? 'bg-amber-100 border-amber-400 text-amber-900' :
                    config.color === 'purple' ? 'bg-purple-100 border-purple-400 text-purple-900' :
                    config.color === 'teal' ? 'bg-teal-100 border-teal-400 text-teal-900' :
                    config.color === 'slate' ? 'bg-slate-100 border-slate-400 text-slate-800' :
                    'bg-indigo-100 border-indigo-400 text-indigo-900'
                  }`}>
                    <span className="text-xl shrink-0">{config.emoji || '🚀'}</span>
                    <span className="truncate max-w-[200px]">{config.label || 'My Sticker'}</span>
                  </div>
                </div>
              </div>

              {/* Emoji Picker Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`font-bold block ${labelColor}`}>Pick Emoji Icon</label>
                  <span className={`text-[11px] ${secondaryColor}`}>Click to select</span>
                </div>
                <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl border-2 max-h-36 overflow-y-auto ${inputBg}">
                  {[
                    '🚀', '📈', '📉', '🎯', '⭐', '⚠️', '✅', '💎',
                    '🐂', '🐻', '💰', '📊', '🔥', '💡', '⏳', '🛑',
                    '🔍', '🏆', '⚡', '📌', '🏷️', '👀', '🔔', '💼',
                    '🏦', '🪙', '🧠', '🛡️', '🔒', '🌱', '☀️', '☕',
                  ].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setConfig({ ...config, emoji: em })}
                      className={`h-9 w-9 text-lg flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                        (config.emoji || '🚀') === em
                          ? 'bg-blue-500/20 border-2 border-blue-500 scale-110 shadow-xs'
                          : 'hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Emoji Input & Label */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className={`font-bold block mb-1 ${labelColor}`}>Custom Emoji</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={config.emoji || ''}
                    onChange={(e) => setConfig({ ...config, emoji: e.target.value })}
                    placeholder="🚀"
                    className={`w-full text-center text-lg rounded-xl border-2 p-2 font-bold focus:outline-none ${inputBg}`}
                  />
                </div>
                <div className="col-span-2">
                  <label className={`font-bold block mb-1 ${labelColor}`}>Sticker Label Text</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={config.label || ''}
                    onChange={(e) => setConfig({ ...config, label: e.target.value })}
                    placeholder="e.g. Breakout Ready, Top Pick"
                    className={`w-full rounded-xl border-2 p-2.5 font-bold focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className={`font-bold block mb-1.5 ${labelColor}`}>Badge Color Theme</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { key: 'green', label: 'Green', dot: 'bg-emerald-400' },
                    { key: 'red', label: 'Red', dot: 'bg-rose-400' },
                    { key: 'blue', label: 'Blue', dot: 'bg-indigo-400' },
                    { key: 'amber', label: 'Amber', dot: 'bg-amber-400' },
                    { key: 'purple', label: 'Purple', dot: 'bg-purple-400' },
                    { key: 'teal', label: 'Teal', dot: 'bg-teal-400' },
                    { key: 'slate', label: 'Slate', dot: 'bg-slate-400' },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setConfig({ ...config, color: c.key })}
                      title={c.label}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition cursor-pointer ${
                        (config.color || 'blue') === c.key
                          ? 'border-blue-500 bg-blue-500/10 scale-105'
                          : 'border-slate-200 dark:border-[#2C2E3A] hover:border-slate-400'
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                      <span className="capitalize">{c.label}</span>
                    </button>
                  ))}
                </div>
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
                  <option value="discord">Discord Webhook (Direct Channel)</option>
                  <option value="telegram">Telegram Bot (Webhook)</option>
                  <option value="webhook">Custom HTTP Endpoint</option>
                </select>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Alert Message / Template</label>
                <input
                  type="text"
                  value={
                    config.template !== undefined && config.template !== ''
                      ? config.template
                      : config.messageTemplate !== undefined && config.messageTemplate !== ''
                      ? config.messageTemplate
                      : '🚀 ${symbol} Breakout: +${price_change}% at Rp${price}'
                  }
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      template: e.target.value,
                      messageTemplate: e.target.value,
                    })
                  }
                  placeholder="🚀 ${symbol} Breakout: +${price_change}% at Rp${price}"
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
                <span className={`text-[11px] block mt-1 ${secondaryColor}`}>
                  Variables: ${'{symbol}'}, ${'{price}'}, ${'{price_change}'}, ${'{volume}'}, ${'{timestamp}'}
                </span>
              </div>

              {config.channel === 'discord' && (
                <div className="space-y-3 pt-2 border-t border-dashed border-slate-200">
                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>
                      Discord Webhook URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={config.discordWebhookUrl || ''}
                      onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      className={`w-full rounded-xl border-2 p-2.5 font-mono text-xs focus:outline-none ${inputBg}`}
                    />
                    <span className={`text-[11px] block mt-1 ${secondaryColor}`}>
                      From Discord Channel Settings &gt; Integrations &gt; Webhooks &gt; Copy Webhook URL
                    </span>
                  </div>

                  <div>
                    <label className={`font-bold block mb-1 ${labelColor}`}>Bot Display Name (Optional)</label>
                    <input
                      type="text"
                      value={config.botName || ''}
                      onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                      placeholder="Scriffle Market Bot"
                      className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="inc-stats"
                      checked={config.includeMarketStats !== false}
                      onChange={(e) => setConfig({ ...config, includeMarketStats: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="inc-stats" className={`text-xs font-semibold cursor-pointer select-none ${labelColor}`}>
                      Include rich financial embed card (price, % change, volume)
                    </label>
                  </div>

                  {/* Test Webhook Button & Status */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleTestDiscordWebhook}
                      disabled={testingWebhook || !config.discordWebhookUrl}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 py-2 px-3 text-xs font-bold transition cursor-pointer ${
                        testingWebhook || !config.discordWebhookUrl
                          ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : isDark
                          ? 'border-[#383B4A] bg-[#1E2235] text-[#818CF8] hover:bg-[#282D46]'
                          : isMono
                          ? 'border-[#D8D4CA] bg-[#EFECE4] text-[#4F46E5] hover:bg-[#EAE7DF]'
                          : 'border-indigo-200 bg-indigo-50 text-[#5865F2] hover:bg-indigo-100'
                      }`}
                    >
                      <MingIcon
                        name={testingWebhook ? 'loading_line' : 'send_plane_line'}
                        size={14}
                        className={testingWebhook ? 'animate-spin' : ''}
                      />
                      <span>{testingWebhook ? 'Sending Test Ping...' : '⚡ Send Test Ping to Discord'}</span>
                    </button>

                    {testWebhookResult && (
                      <div
                        className={`mt-2 rounded-xl p-2.5 text-xs border flex items-start gap-2 ${
                          testWebhookResult.success
                            ? isDark
                              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isDark
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <MingIcon
                          name={testWebhookResult.success ? 'check_circle_line' : 'close_circle_line'}
                          size={16}
                          className="shrink-0 mt-0.5"
                        />
                        <span className="leading-snug">{testWebhookResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Persistence Awareness Notice */}
                  <div
                    className={`rounded-xl p-3 text-xs leading-relaxed border ${
                      isDark
                        ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]'
                        : isMono
                        ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    💡 <strong>Webhook Persistence:</strong> This webhook URL stays saved on this Alert card and persists across sessions, board switches, and in downloaded <code>.scriffle</code> project files.
                  </div>

                  {/* Immediate Save Button */}
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`w-full rounded-xl py-2 px-3 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDark
                        ? 'bg-[#818CF8] text-[#0F1014] hover:bg-[#9FA8FA]'
                        : isMono
                        ? 'bg-[#0050FF] text-white hover:bg-[#0040D0]'
                        : 'bg-[#5865F2] text-white hover:bg-[#4752C4]'
                    }`}
                  >
                    <MingIcon name="save_line" size={14} />
                    <span>Save Alert Settings</span>
                  </button>
                </div>
              )}
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
                    <label className={`font-bold block mb-1 ${labelColor}`}>Target Stock Symbol / Company (Optional Override)</label>
                    <CompanyCombobox
                      value={config.targetSymbol || config.params?.symbol || ''}
                      onChange={(sym) =>
                        setConfig({
                          ...config,
                          targetSymbol: sym,
                          params: { ...config.params, symbol: sym },
                        })
                      }
                      onOpenScreener={onOpenScreener}
                      placeholder="Leave empty for dynamic ticker or choose company..."
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
                <div className="space-y-2">
                  <div className={`rounded-xl p-3 text-xs leading-relaxed border ${
                    isDark
                      ? 'bg-[#191A22] border-[#252732] text-[#8C90A0]'
                      : isMono
                      ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    📊 <strong>Multi-Symbol Automated Sectors Brief:</strong> When triggered by Top Gainers/Losers or single breakout events, Scriffle fetches fundamentals from <code>/v2/company/report/{'${symbol}'}/</code> for <strong>each outputted ticker</strong>, generating structured research notes and auto-saved PDF briefs.
                  </div>

                  <div className={`rounded-xl p-3 border space-y-1.5 ${
                    isDark
                      ? 'bg-[#201F18] border-amber-500/30 text-amber-200'
                      : isMono
                      ? 'bg-[#FDF8EE] border-amber-500/40 text-amber-900'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <MingIcon name="warning_line" size={14} className="text-amber-600" />
                        API Credit Notice & Burst Warning
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10">
                        8 credits / symbol
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Each fundamental report consumes <strong>8 credits</strong>. When connected to a 5-stock Top Movers Radar or Screener, triggering this action will consume <strong>40 credits per execution burst</strong>.
                    </p>
                  </div>
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

          {node.type === 'image' && (
            <>
              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Image URL</label>
                <input
                  type="text"
                  value={config.url || ''}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://... or data:image/..."
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Upload New Image</label>
                <label className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border-2 border-dashed cursor-pointer transition ${
                  isDark ? 'border-[#2C2E3A] hover:border-[#8E95A5] bg-[#191A22]' : isMono ? 'border-[#D8D4CA] hover:border-[#78756D] bg-[#F4F3EF]' : 'border-slate-300 hover:border-slate-500 bg-slate-50'
                }`}>
                  <MingIcon name="upload_2_line" size={20} className={secondaryColor} />
                  <span className={`text-[11px] font-semibold ${labelColor}`}>Click to select an image from your computer</span>
                  <span className={`text-[10px] ${secondaryColor}`}>PNG, JPG, SVG, WebP supported</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (uploadEvt) => {
                        const dataUrl = uploadEvt.target?.result as string;
                        setConfig({
                          ...config,
                          url: dataUrl,
                          isTransparent: file.type.includes('png') || file.type.includes('svg') ? config.isTransparent ?? true : false,
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Caption (Optional)</label>
                <input
                  type="text"
                  value={config.caption || ''}
                  onChange={(e) => setConfig({ ...config, caption: e.target.value })}
                  placeholder="e.g. Q3 Banking Sector Overview Chart"
                  className={`w-full rounded-xl border-2 p-2.5 font-medium focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className={`font-bold block mb-1 ${labelColor}`}>Display Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, isTransparent: true })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 font-bold transition cursor-pointer ${
                      config.isTransparent ?? true
                        ? isDark
                          ? 'border-[#0050FF] bg-[#0050FF]/20 text-[#0050FF]'
                          : isMono
                          ? 'border-[#242321] bg-white text-[#242321]'
                          : 'border-[#0050FF] bg-blue-50 text-[#0050FF]'
                        : isDark
                        ? 'border-[#2C2E3A] bg-[#191A22] text-[#8C90A0]'
                        : isMono
                        ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D]'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <MingIcon name="ghost_line" size={16} />
                    <span>Transparent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, isTransparent: false })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 font-bold transition cursor-pointer ${
                      !(config.isTransparent ?? true)
                        ? isDark
                          ? 'border-[#0050FF] bg-[#0050FF]/20 text-[#0050FF]'
                          : isMono
                          ? 'border-[#242321] bg-white text-[#242321]'
                          : 'border-[#0050FF] bg-blue-50 text-[#0050FF]'
                        : isDark
                        ? 'border-[#2C2E3A] bg-[#191A22] text-[#8C90A0]'
                        : isMono
                        ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D]'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <MingIcon name="square_line" size={16} />
                    <span>Bordered Card</span>
                  </button>
                </div>
              </div>

              {(config.width || config.height) && (
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[11px] ${secondaryColor}`}>
                    Custom dimensions: {Math.round(config.width || 0)} × {Math.round(config.height || 0)} px
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, width: undefined, height: undefined })}
                    className={`text-[11px] font-bold underline transition cursor-pointer ${
                      isDark ? 'text-amber-400' : isMono ? 'text-[#242321]' : 'text-blue-600'
                    }`}
                  >
                    Reset dimensions
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex justify-end gap-2 border-t px-6 py-4 shrink-0 ${headerBorder}`}>
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
