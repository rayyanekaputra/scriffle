/**
 * Pure geometry and layout engine for Tidy Up & Auto-Distribute.
 * Guarantees zero overlaps and respects handle clearances.
 */

export interface TidyNode {
  id: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: any;
}

export interface TidyResult {
  id: string;
  position: { x: number; y: number };
}

export type TidyMode = 'auto' | 'horizontal' | 'vertical' | 'grid';

export const TIDY_HORIZONTAL_GAP = 48; // Spacing for 36px floating quick-add handles + clearance
export const TIDY_VERTICAL_GAP = 36;   // Vertical inter-card breathing room
export const TIDY_GRID_GAP_X = 48;
export const TIDY_GRID_GAP_Y = 36;

export const DEFAULT_NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  watcher_radar: { width: 400, height: 260 },
  watcher_single: { width: 340, height: 180 },
  screener: { width: 360, height: 300 },
  condition: { width: 280, height: 120 },
  note: { width: 280, height: 180 },
  action: { width: 280, height: 140 },
  alert: { width: 280, height: 130 },
  text: { width: 260, height: 100 },
  file: { width: 280, height: 120 },
  image: { width: 300, height: 200 },
  sticker: { width: 180, height: 70 },
  default: { width: 280, height: 140 },
};

/**
 * Accurately determines node dimensions, prioritizing measured DOM values,
 * followed by node config, and finally type-specific defaults.
 */
export function resolveNodeDimensions(node: {
  type?: string;
  measured?: { width?: number; height?: number };
  data?: { config?: any };
}): { width: number; height: number } {
  const measuredW = node.measured?.width;
  const measuredH = node.measured?.height;
  const configW = node.data?.config?.width;
  const configH = node.data?.config?.height;

  if (measuredW && measuredH && measuredW > 0 && measuredH > 0) {
    return { width: measuredW, height: measuredH };
  }

  const type = node.type || 'default';
  const cfg = node.data?.config;
  const isRadar = type === 'watcher' && (cfg?.mode === 'top_gainers' || cfg?.mode === 'top_losers');
  const lookupKey = isRadar ? 'watcher_radar' : type === 'watcher' ? 'watcher_single' : type;
  const fallback = DEFAULT_NODE_DIMENSIONS[lookupKey] || DEFAULT_NODE_DIMENSIONS.default;

  return {
    width: configW ?? fallback.width,
    height: configH ?? fallback.height,
  };
}

/**
 * Detects whether the layout should be a 1D horizontal row, 1D vertical column, or 2D grid.
 */
export function detectTidyMode(nodes: TidyNode[]): 'horizontal' | 'vertical' | 'grid' {
  if (nodes.length < 3) return 'horizontal';

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  const spreadX = maxX - minX;
  const spreadY = maxY - minY;

  // If >= 4 nodes and spread across both dimensions with reasonable aspect ratio, use 2D grid
  if (nodes.length >= 4) {
    const ratio = spreadX / (spreadY || 1);
    if (ratio >= 0.5 && ratio <= 2.2) {
      return 'grid';
    }
  }

  return spreadX >= spreadY ? 'horizontal' : 'vertical';
}

/**
 * Distributes nodes horizontally with zero overlaps, aligned along the top anchor.
 */
export function tidyHorizontal(nodes: TidyNode[], gap: number = TIDY_HORIZONTAL_GAP): TidyResult[] {
  if (nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => a.x - b.x);

  const minX = Math.min(...sorted.map((n) => n.x));
  const minY = Math.min(...sorted.map((n) => n.y));

  let currentX = minX;
  return sorted.map((n) => {
    const pos = { x: currentX, y: minY };
    currentX += n.width + gap;
    return { id: n.id, position: pos };
  });
}

/**
 * Distributes nodes vertically with zero overlaps, aligned along the left anchor.
 */
export function tidyVertical(nodes: TidyNode[], gap: number = TIDY_VERTICAL_GAP): TidyResult[] {
  if (nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => a.y - b.y);

  const minX = Math.min(...sorted.map((n) => n.x));
  const minY = Math.min(...sorted.map((n) => n.y));

  let currentY = minY;
  return sorted.map((n) => {
    const pos = { x: minX, y: currentY };
    currentY += n.height + gap;
    return { id: n.id, position: pos };
  });
}

/**
 * Distributes nodes into a clean 2D non-overlapping grid.
 */
export function tidyGrid(
  nodes: TidyNode[],
  gapX: number = TIDY_GRID_GAP_X,
  gapY: number = TIDY_GRID_GAP_Y
): TidyResult[] {
  if (nodes.length === 0) return [];

  // Sort nodes in spatial reading order (top-to-bottom, left-to-right)
  const sorted = [...nodes].sort((a, b) => {
    const rowDelta = a.y - b.y;
    if (Math.abs(rowDelta) > 50) return rowDelta;
    return a.x - b.x;
  });

  const cols = Math.ceil(Math.sqrt(sorted.length));
  const rows = Math.ceil(sorted.length / cols);

  const minX = Math.min(...sorted.map((n) => n.x));
  const minY = Math.min(...sorted.map((n) => n.y));

  // Compute column max widths and row max heights to avoid any overlap
  const colWidths: number[] = new Array(cols).fill(0);
  const rowHeights: number[] = new Array(rows).fill(0);

  sorted.forEach((node, index) => {
    const c = index % cols;
    const r = Math.floor(index / cols);
    colWidths[c] = Math.max(colWidths[c], node.width);
    rowHeights[r] = Math.max(rowHeights[r], node.height);
  });

  // Calculate cumulative offsets
  const colOffsets: number[] = [0];
  for (let c = 1; c < cols; c++) {
    colOffsets[c] = colOffsets[c - 1] + colWidths[c - 1] + gapX;
  }

  const rowOffsets: number[] = [0];
  for (let r = 1; r < rows; r++) {
    rowOffsets[r] = rowOffsets[r - 1] + rowHeights[r - 1] + gapY;
  }

  return sorted.map((node, index) => {
    const c = index % cols;
    const r = Math.floor(index / cols);
    return {
      id: node.id,
      position: {
        x: minX + colOffsets[c],
        y: minY + rowOffsets[r],
      },
    };
  });
}

/**
 * Master dispatcher for Tidy Up layout.
 */
export function tidyUpNodes(
  nodes: TidyNode[],
  mode: TidyMode = 'auto',
  customGap?: number
): TidyResult[] {
  if (nodes.length < 3) return [];

  const effectiveMode = mode === 'auto' ? detectTidyMode(nodes) : mode;

  switch (effectiveMode) {
    case 'horizontal':
      return tidyHorizontal(nodes, customGap ?? TIDY_HORIZONTAL_GAP);
    case 'vertical':
      return tidyVertical(nodes, customGap ?? TIDY_VERTICAL_GAP);
    case 'grid':
      return tidyGrid(nodes, customGap ?? TIDY_GRID_GAP_X, customGap ?? TIDY_GRID_GAP_Y);
    default:
      return tidyHorizontal(nodes, customGap ?? TIDY_HORIZONTAL_GAP);
  }
}
