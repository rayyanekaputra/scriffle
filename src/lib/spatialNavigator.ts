export interface SimpleNodePosition {
  id: string;
  position: { x: number; y: number };
}

export interface SimpleEdge {
  from?: string;
  to?: string;
  source?: string;
  target?: string;
}

/**
 * Calculates Euclidean distance between two nodes
 */
export function getDistance(
  posA: { x: number; y: number },
  posB: { x: number; y: number }
): number {
  const dx = posB.x - posA.x;
  const dy = posB.y - posA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds the next closest or connected node for spatial Tab navigation without oscillating/ping-ponging
 */
export function findNextSpatialNode(
  currentNodeId: string | null | undefined,
  nodes: SimpleNodePosition[],
  edges: SimpleEdge[] = [],
  direction: 'forward' | 'backward' = 'forward'
): SimpleNodePosition | null {
  if (!nodes || nodes.length <= 1) return null;

  // Reading order sort helper (top-to-bottom, left-to-right)
  const sortByReadingOrder = (list: SimpleNodePosition[]) =>
    [...list].sort((a, b) => {
      // If Y delta is significant (> 100px), row order dominates
      if (Math.abs(a.position.y - b.position.y) > 100) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

  // If no node is currently active, pick the first node in reading order
  if (!currentNodeId) {
    const sorted = sortByReadingOrder(nodes);
    return sorted[0] || null;
  }

  const currentNode = nodes.find((n) => n.id === currentNodeId);
  if (!currentNode) {
    const sorted = sortByReadingOrder(nodes);
    return sorted[0] || null;
  }

  const otherNodes = nodes.filter((n) => n.id !== currentNodeId);
  if (otherNodes.length === 0) return null;

  if (direction === 'forward') {
    // 1. First priority: Check outgoing connected edges
    const outgoingTargets = edges
      .filter((e) => e.from === currentNodeId || e.source === currentNodeId)
      .map((e) => e.to || e.target)
      .filter(Boolean) as string[];

    const connectedNodes = otherNodes.filter((n) => outgoingTargets.includes(n.id));
    if (connectedNodes.length > 0) {
      connectedNodes.sort(
        (a, b) => getDistance(currentNode.position, a.position) - getDistance(currentNode.position, b.position)
      );
      return connectedNodes[0];
    }

    // 2. Second priority: Filter nodes strictly ahead (x > current.x + 15 or in a lower row)
    const forwardCandidates = otherNodes.filter((n) => {
      const dx = n.position.x - currentNode.position.x;
      const dy = n.position.y - currentNode.position.y;
      // In same horizontal lane or to the right
      if (dx > 15) return true;
      // In a lower row (downwards)
      if (dy > 60) return true;
      return false;
    });

    if (forwardCandidates.length > 0) {
      // Pick the closest forward candidate
      forwardCandidates.sort((a, b) => {
        const distA = getDistance(currentNode.position, a.position);
        const distB = getDistance(currentNode.position, b.position);
        return distA - distB;
      });
      return forwardCandidates[0];
    }

    // 3. End of canvas reached: Wrap around to the start (top-left node)
    const sorted = sortByReadingOrder(nodes);
    return sorted[0] && sorted[0].id !== currentNodeId ? sorted[0] : otherNodes[0];
  } else {
    // Backward direction (Shift+Tab)
    // 1. First priority: Check incoming connected edges
    const incomingSources = edges
      .filter((e) => e.to === currentNodeId || e.target === currentNodeId)
      .map((e) => e.from || e.source)
      .filter(Boolean) as string[];

    const connectedNodes = otherNodes.filter((n) => incomingSources.includes(n.id));
    if (connectedNodes.length > 0) {
      connectedNodes.sort(
        (a, b) => getDistance(currentNode.position, a.position) - getDistance(currentNode.position, b.position)
      );
      return connectedNodes[0];
    }

    // 2. Second priority: Filter nodes strictly behind (x < current.x - 15 or in an upper row)
    const backwardCandidates = otherNodes.filter((n) => {
      const dx = n.position.x - currentNode.position.x;
      const dy = n.position.y - currentNode.position.y;
      // In same horizontal lane to the left
      if (dx < -15) return true;
      // In an upper row (upwards)
      if (dy < -60) return true;
      return false;
    });

    if (backwardCandidates.length > 0) {
      // Pick the closest backward candidate
      backwardCandidates.sort((a, b) => {
        const distA = getDistance(currentNode.position, a.position);
        const distB = getDistance(currentNode.position, b.position);
        return distA - distB;
      });
      return backwardCandidates[0];
    }

    // 3. Start of canvas reached: Wrap around to the end (furthest bottom-right node)
    const sorted = sortByReadingOrder(nodes);
    const lastNode = sorted[sorted.length - 1];
    return lastNode && lastNode.id !== currentNodeId ? lastNode : otherNodes[otherNodes.length - 1];
  }
}
