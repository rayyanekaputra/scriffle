import { CanvasData, ExecutionLog } from '@/types/canvas';

export interface MissionProgress {
  id: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface MissionBaseline {
  nodeIds?: string[];
  edgeIds?: string[];
  logCount?: number;
}

/**
 * Validates which of the 6 sandbox missions are completed based on canvas graph structure and execution logs.
 * Supports an optional baseline snapshot so existing canvas nodes do not immediately re-complete missions after a user reset.
 */
export function evaluateMissionProgress(
  canvas: CanvasData | null | undefined,
  logs: ExecutionLog[] | null | undefined,
  existingProgress: Record<string, MissionProgress> = {},
  baseline?: MissionBaseline
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

  const isNewNode = (id: string) => !baseline?.nodeIds || !baseline.nodeIds.includes(id);
  const isNewEdge = (id: string) => !baseline?.edgeIds || !baseline.edgeIds.includes(id);

  // Mission 1: Deploy Watcher & Pick a Stock
  // Completed if any watcher node exists with a non-empty symbol that was added or configured
  const hasWatcherWithStock = nodes.some(
    (n) =>
      n.type === 'watcher' &&
      isNewNode(n.id) &&
      ((n.config?.symbol && n.config.symbol.trim().length > 0) ||
        n.config?.mode === 'top_gainers' ||
        n.config?.mode === 'top_losers')
  );
  if (hasWatcherWithStock) {
    markComplete('mission-watcher-stock');
  }

  // Mission 2: Map Research with a File Attachment
  // Completed if any file node exists on the canvas
  const hasFileNode = nodes.some((n) => n.type === 'file' && isNewNode(n.id));
  if (hasFileNode) {
    markComplete('mission-file-research');
  }

  // Mission 3: Auto-Wire a Condition Rule
  // Completed if there is an edge from a watcher to a condition node
  const hasWatcherToConditionEdge = edges.some((e) => {
    if (!isNewEdge(e.id)) return false;
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
    if (!isNewEdge(e.id)) return false;
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
  const hasAnnotationNode = nodes.some(
    (n) => (n.type === 'text' || n.type === 'sticker' || n.type === 'image') && isNewNode(n.id)
  );
  if (hasAnnotationNode) {
    markComplete('mission-freeform-annotation');
  }

  // Mission 6: Run Live Simulation (Do Once)
  // Completed if logs contain new execution events beyond baseline or a new node has cycleCount / runCount > 0
  const baselineLogs = baseline?.logCount || 0;
  const hasSimulated =
    (logs && logs.length > baselineLogs) ||
    nodes.some(
      (n) =>
        isNewNode(n.id) &&
        (((n.state as any)?.cycleCount && (n.state as any).cycleCount > 0) ||
          ((n.state as any)?.runCount && (n.state as any).runCount > 0))
    );
  if (hasSimulated) {
    markComplete('mission-simulate-execution');
  }

  return result;
}
