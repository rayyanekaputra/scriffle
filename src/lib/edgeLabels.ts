import { NodeType } from '@/types/canvas';

/**
 * Auto-infers contextual edge badge labels based on source and target node types.
 */
export function inferEdgeLabel(sourceType?: string | null, targetType?: string | null): string | null {
  if (!sourceType || !targetType) return null;

  const src = sourceType.toLowerCase() as NodeType;
  const tgt = targetType.toLowerCase() as NodeType;

  // Condition node downstream triggers
  if (src === 'condition') {
    if (tgt === 'action' || tgt === 'note' || tgt === 'alert') {
      return 'if true';
    }
    return 'evaluates';
  }

  // Watcher node streaming events
  if (src === 'watcher') {
    if (tgt === 'condition') {
      return 'on tick';
    }
    if (tgt === 'note') {
      return 'on change';
    }
    if (tgt === 'action') {
      return 'on spike';
    }
    return 'streams';
  }

  // AI Screener output matches
  if (src === 'screener') {
    if (tgt === 'watcher') {
      return 'discovered';
    }
    if (tgt === 'action') {
      return 'pipe results';
    }
    if (tgt === 'note') {
      return 'summary';
    }
    return 'matches';
  }

  // Action node canvas mutations & exports
  if (src === 'action') {
    if (tgt === 'file') {
      return 'generates';
    }
    if (tgt === 'note') {
      return 'brief';
    }
    if (tgt === 'watcher') {
      return 'spawns';
    }
    return 'triggers';
  }

  // Freeform text or notes connecting to other elements
  if (src === 'note' && (tgt === 'file' || tgt === 'action')) {
    return 'references';
  }

  return null;
}

/**
 * Resolves the display label for an edge, prioritizing explicit custom labels
 * and falling back to automated rule inference.
 */
export function resolveEdgeLabel(
  explicitLabel?: string | null,
  sourceType?: string | null,
  targetType?: string | null
): string | null {
  if (explicitLabel && explicitLabel.trim().length > 0) {
    return explicitLabel.trim();
  }
  return inferEdgeLabel(sourceType, targetType);
}
