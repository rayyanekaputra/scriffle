'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { WhiteboardContent } from '@/app/page';

export default function BoardPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  return (
    <ToastProvider>
      <WhiteboardContent canvasId={id} />
    </ToastProvider>
  );
}
