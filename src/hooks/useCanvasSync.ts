'use client';

import useSWR from 'swr';
import { CanvasData, ExecutionLog } from '@/types/canvas';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCanvasSync() {
  const { data, error, isLoading, mutate } = useSWR<CanvasData>('/api/canvas', fetcher, {
    refreshInterval: 2000, // Poll every 2 seconds
    revalidateOnFocus: true,
  });

  const { data: logs, mutate: mutateLogs } = useSWR<ExecutionLog[]>('/api/logs', fetcher, {
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
