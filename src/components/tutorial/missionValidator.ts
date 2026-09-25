import { CanvasData, ExecutionLog } from '@/types/canvas';

export interface MissionProgress {
  id: string;
  isCompleted: boolean;
  completedAt?: string;
}

/**
 * Validates which of the 6 sandbox missions are completed based on canvas graph structure and execution logs.
 */
export function evaluateMissionProgress(
  canvas: CanvasData | null | undefined,
  logs: ExecutionLog[] | null | undefined,
  existingProgress: Record<string, MissionProgress> = {}
): Record<string, MissionProgress> {
  const result: Record<string, MissionProgress> = { ...existingProgress };

  const now = new Date().toISOString();
  const markComplete = (id: string) => {
    if (!result[id]?.isCompleted) {
      result[id] = { id, isCompleted: true, completedAt: now };
    }
  };

  const nodes = canvas?.nodes || [];
  const edges = canvas?.edges || [];

  // Mission 1: Deploy Watcher & Pick a Stock
  // Completed if any watcher node exists with a non-empty symbol
  const hasWatcherWithStock = nodes.some(
    (n) => n.type === 'watcher' && ((n.config?.symbol && n.config.symbol.trim().length > 0) || n.config?.mode === 'top_gainers' || n.config?.mode === 'top_losers')
  );
  if (hasWatcherWithStock) {
    markComplete('mission-watcher-stock');
  }

  // Mission 2: Map Research with a File Attachment
  // Completed if any file node exists on the canvas
  const hasFileNode = nodes.some((n) => n.type === 'file');
  if (hasFileNode) {
    markComplete('mission-file-research');
  }

  // Mission 3: Auto-Wire a Condition Rule
  // Completed if there is an edge from a watcher to a condition node
  const hasWatcherToConditionEdge = edges.some((e) => {
    const sourceNode = nodes.find((n) => n.id === e.from);
    const targetNode = nodes.find((n) => n.id === e.to);
    return (
      (sourceNode?.type === 'watcher' || sourceNode?.type === 'screener') &&
      targetNode?.type === 'condition'
    );
  });
  if (hasWatcherToConditionEdge) {
    markComplete('mission-wire-condition');
  }

  // Mission 4: Branch to a Sticky Note or Discord Alert
  // Completed if there is an edge from a condition node to note or alert
  const hasConditionToOutputEdge = edges.some((e) => {
    const sourceNode = nodes.find((n) => n.id === e.from);
    const targetNode = nodes.find((n) => n.id === e.to);
    return (
      sourceNode?.type === 'condition' &&
      (targetNode?.type === 'note' || targetNode?.type === 'alert' || targetNode?.type === 'action')
    );
  });
  if (hasConditionToOutputEdge) {
    markComplete('mission-branch-output');
  }

  // Mission 5: Add Freeform Annotation (Text or Sticker)
  // Completed if a text or sticker node is placed on the canvas
  const hasAnnotationNode = nodes.some((n) => n.type === 'text' || n.type === 'sticker' || n.type === 'image');
  if (hasAnnotationNode) {
    markComplete('mission-freeform-annotation');
  }

  // Mission 6: Run Live Simulation (Do Once)
  // Completed if logs contain execution events or any node has cycleCount / runCount > 0
  const hasSimulated = (logs && logs.length > 0) || nodes.some(
    (n) => ((n.state as any)?.cycleCount && (n.state as any).cycleCount > 0) || ((n.state as any)?.runCount && (n.state as any).runCount > 0)
  );
  if (hasSimulated) {
    markComplete('mission-simulate-execution');
  }

  return result;
}
