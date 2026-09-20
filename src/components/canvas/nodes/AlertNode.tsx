'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AlertConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

export const AlertNode = memo(({ data, selected }: NodeProps) => {
  const { theme, activeCustomTheme } = useTheme();
  const config = (data.config || {}) as AlertConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const channel = config.channel || 'ui';

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const cardBorder = isDark
    ? selected
      ? 'border-[#8E95A5] ring-2 ring-[#8E95A5]/20'
      : isPassed
      ? 'border-[#8E95A5]'
      : 'border-[#282A36] hover:border-[#383B4A]'
    : isMono
    ? selected
      ? 'border-[#242321] ring-2 ring-[#242321]/20'
      : isPassed
      ? 'border-[#242321]'
      : 'border-[#D1CEC4] hover:border-[#B5B0A2]'
    : selected
    ? 'border-[#FF5B79] ring-2 ring-[#FF5B79]/20'
    : isPassed
    ? 'border-[#FF5B79]'
    : 'border-slate-300 hover:border-slate-400';

  const cardBg = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-node-card-bg)] text-[var(--custom-ui-text)]'
    : isDark
    ? 'bg-[#181920] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] text-[#242321]'
    : 'bg-white text-slate-900';

  const channelLabel =
    channel === 'discord'
      ? 'Discord'
      : channel === 'telegram'
      ? 'Telegram'
      : channel === 'webhook'
      ? 'Webhook'
      : 'In-App Toast';

  return (
    <div
      className={`relative w-68 rounded-2xl border-2 p-4 transition-all duration-150 ${cardBg} ${cardBorder}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#5A5852]'
            : '!border-white !bg-[#FF5B79]'
        }`}
      />

      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          isDark ? 'border-[#262833]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`rounded-xl p-1.5 border ${
              channel === 'discord'
                ? isDark
                  ? 'bg-[#1E2235] text-[#818CF8] border-[#313752]'
                  : isMono
                  ? 'bg-[#EFECE4] text-[#4F46E5] border-[#D8D4CA]'
                  : 'bg-indigo-50 text-[#5865F2] border-indigo-200'
                : isDark
                ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
                : isMono
                ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
                : 'bg-rose-50 text-[#FF5B79] border-rose-200'
            }`}
          >
            <MingIcon
              name={channel === 'discord' ? 'send_plane_line' : 'notification_line'}
              size={18}
            />
          </div>
          <div>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              Notification
            </span>
            <h3
              className={`text-xs font-bold leading-tight ${
                isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
              }`}
            >
              Market Alert
            </h3>
          </div>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${
            channel === 'discord'
              ? isDark
                ? 'bg-[#1E2235] text-[#818CF8] border-[#313752]'
                : isMono
                ? 'bg-[#EFECE4] text-[#4F46E5] border-[#D8D4CA]'
                : 'bg-indigo-50 text-[#5865F2] border-indigo-200'
              : isDark
              ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
              : isMono
              ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
              : 'bg-rose-50 text-[#FF5B79] border-rose-200'
          }`}
        >
          {channelLabel}
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div
          className={`rounded-xl p-2.5 border ${
            isCustom && activeCustomTheme
              ? 'bg-[var(--custom-node-card-bg)] border-[var(--custom-node-card-border)] text-[var(--custom-ui-text)]'
              : isDark
              ? 'bg-[#14151B] border-[#252732] text-[#D8DAE2]'
              : isMono
              ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#242321]'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium opacity-80">Channel Target</span>
            <span className="font-semibold text-xs">{channelLabel}</span>
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200/50 text-[11px]">
            <span className="opacity-70 block mb-0.5">Template:</span>
            <div className="font-mono text-[10.5px] font-medium truncate leading-tight opacity-90">
              {config.template || config.messageTemplate || '🚀 ${symbol} Breakout: +${price_change}% at Rp${price}'}
            </div>
          </div>

          {channel === 'discord' && (
            <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200/50 flex items-center justify-between text-[11px]">
              <span className="opacity-70">Webhook:</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                  config.discordWebhookUrl
                    ? isDark
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDark
                    ? 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {config.discordWebhookUrl ? 'Configured' : 'Missing URL'}
              </span>
            </div>
          )}
        </div>

        {/* Webhook Delivery Feedback */}
        {channel === 'discord' && state.lastWebhookStatus && (
          <div
            className={`rounded-xl p-2 text-[11px] border flex items-center gap-1.5 ${
              state.lastWebhookStatus === 'success'
                ? isDark
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : isMono
                  ? 'bg-[#EAF3EC] border-[#C8E1CE] text-[#1E5C2B]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDark
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : isMono
                ? 'bg-[#F9EAE8] border-[#EAC4BF] text-[#7A2B20]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <MingIcon
              name={state.lastWebhookStatus === 'success' ? 'check_circle_line' : 'close_circle_line'}
              size={14}
            />
            <span className="font-medium truncate">
              {state.lastWebhookStatus === 'success'
                ? 'Delivered to Discord'
                : state.lastWebhookError || 'Delivery failed'}
            </span>
          </div>
        )}

        <div
          className={`flex items-center justify-between text-[11px] pt-1 ${
            isDark ? 'text-[#686B7C]' : isMono ? 'text-[#8C8980]' : 'text-slate-400'
          }`}
        >
          <span>Trigger status:</span>
          <span>{state.lastTriggeredAt ? `Fired ${state.lastTriggeredAt}` : 'Never fired'}</span>
        </div>
      </div>
    </div>
  );
});

AlertNode.displayName = 'AlertNode';
