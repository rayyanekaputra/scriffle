'use client';

import useSWR from 'swr';
import { CanvasData, ExecutionLog } from '@/types/canvas';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCanvasSync(canvasId?: string) {
  const canvasUrl = canvasId ? `/api/canvas?id=${encodeURIComponent(canvasId)}` : '/api/canvas';
  const logsUrl = canvasId ? `/api/logs?canvasId=${encodeURIComponent(canvasId)}` : '/api/logs';

  const { data, error, isLoading, mutate } = useSWR<CanvasData>(canvasUrl, fetcher, {
    refreshInterval: 2000, // Poll every 2 seconds
    revalidateOnFocus: true,
  });

  const { data: logs, mutate: mutateLogs } = useSWR<ExecutionLog[]>(logsUrl, fetcher, {
    refreshInterval: 2000,
  });

  return {
    canvas: data,
    logs: logs || data?.logs || [],
    isLoading,
    isError: error,
    mutate,
    mutateLogs,
  };
}
