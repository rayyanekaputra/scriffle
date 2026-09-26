import { NodeType } from '@/types/canvas';

export interface QuickAddOption {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  color: string;
  recommended?: boolean;
}

export const ALL_QUICK_ADD_NODES: QuickAddOption[] = [
  {
    type: 'condition',
    label: 'Condition',
    icon: 'filter_line',
    description: 'DSL rule check (e.g. price_change > 3%)',
    color: '#FFD728',
  },
  {
    type: 'note',
    label: 'Sticky Note',
    icon: 'edit_3_line',
    description: 'Dynamic brief with auto-interpolated metrics',
    color: '#FEF08A',
  },
  {
    type: 'action',
    label: 'Action',
    icon: 'flash_line',
    description: 'Automate fundamental PDF reports & canvas mutations',
    color: '#0050FF',
  },
  {
    type: 'alert',
    label: 'Alert',
    icon: 'notification_line',
    description: 'UI toast and activity stream notification',
    color: '#FF5B79',
  },
  {
    type: 'watcher',
    label: 'Watcher',
    icon: 'radar_line',
    description: 'Track IDX stock ticker or Top Movers leaderboard',
    color: '#10B981',
  },
  {
    type: 'screener',
    label: 'AI Screener',
    icon: 'sparkles_line',
    description: 'Natural language IDX stock screener',
    color: '#0050FF',
  },
  {
    type: 'file',
    label: 'File Attachment',
    icon: 'attachment_line',
    description: 'Attach PDF reports or documents',
    color: '#8B5CF6',
  },
  {
    type: 'text',
    label: 'Free-Text',
    icon: 'text_line',
    description: 'WYSIWYG markdown title or annotation',
    color: '#64748B',
  },
  {
    type: 'sticker',
    label: 'Sticker',
    icon: 'thumb_up_line',
    description: 'Custom emoji badge sticker',
    color: '#F59E0B',
  },
];

/**
 * Returns prioritized and contextual node recommendations based on the source node type.
 */
export function getRecommendedNodeTypes(sourceNodeType?: NodeType | null): QuickAddOption[] {
  if (!sourceNodeType) return ALL_QUICK_ADD_NODES;

  let priorityTypes: NodeType[] = [];

  switch (sourceNodeType) {
    case 'watcher':
      priorityTypes = ['condition', 'note', 'action', 'alert'];
      break;
    case 'screener':
      priorityTypes = ['note', 'action', 'watcher', 'condition'];
      break;
    case 'condition':
      priorityTypes = ['note', 'alert', 'action'];
      break;
    case 'action':
      priorityTypes = ['file', 'note', 'watcher', 'alert'];
      break;
    default:
      priorityTypes = ['condition', 'note', 'action', 'alert', 'file'];
  }

  const prioritized: QuickAddOption[] = [];
  const remaining: QuickAddOption[] = [];

  for (const opt of ALL_QUICK_ADD_NODES) {
    if (priorityTypes.includes(opt.type)) {
      prioritized.push({ ...opt, recommended: true });
    } else {
      remaining.push({ ...opt, recommended: false });
    }
  }

  // Sort prioritized by order in priorityTypes
  prioritized.sort((a, b) => priorityTypes.indexOf(a.type) - priorityTypes.indexOf(b.type));

  return [...prioritized, ...remaining];
}

/**
 * Calculates a non-overlapping target coordinate to place a new downstream node.
 * Default offset is (x + 320, y). If occupied, staggers downwards.
 */
export function calculateQuickAddPosition(
  sourcePosition: { x: number; y: number },
  existingNodes: Array<{ position: { x: number; y: number } }> = []
): { x: number; y: number } {
  let targetX = sourcePosition.x + 320;
  let targetY = sourcePosition.y;

  const COLLISION_WIDTH = 240;
  const COLLISION_HEIGHT = 120;
  const MAX_ATTEMPTS = 6;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const hasCollision = existingNodes.some((node) => {
      const dx = Math.abs(node.position.x - targetX);
      const dy = Math.abs(node.position.y - targetY);
      return dx < COLLISION_WIDTH && dy < COLLISION_HEIGHT;
    });

    if (!hasCollision) {
      return { x: targetX, y: targetY };
    }

    // Stagger down and slightly right
    targetY += 150;
  }

  return { x: targetX, y: targetY };
}

/**
 * Builds standard default configuration for newly auto-added nodes,
 * smartly inheriting symbols or defaults from the source node when available.
 */
export function getDefaultConfigForQuickAdd(
  targetType: NodeType,
  sourceNode?: { type: NodeType; config?: any; sourceHandleId?: string | null }
): any {
  const sourceCfg = sourceNode?.config || {};
  const symbol = sourceCfg.symbol || 'BBCA';
  const isFalseBranch = sourceNode?.sourceHandleId === 'false';

  switch (targetType) {
    case 'condition':
      return {
        rule: 'price_change > 0',
      };
    case 'note':
      if (isFalseBranch) {
        return {
          color: 'pink',
          content: '${symbol} held steady at ${price} (${price_change}%)',
          template: '${symbol} held steady at ${price} (${price_change}%)',
        };
      }
      return {
        color: 'yellow',
        content: sourceNode?.type === 'watcher'
          ? '${symbol} price update: ${price} (${price_change}%)'
          : 'Dynamic market note',
        template: '${symbol} price update: ${price} (${price_change}%)',
      };
    case 'action':
      return {
        action: 'fundamental_report',
        targetSymbol: symbol,
      };
    case 'alert':
      return {
        channel: 'ui',
        message: isFalseBranch
          ? '${symbol} condition not met (${price_change}%)'
          : '🚀 ${symbol} Breakout: +${price_change}% at Rp${price}',
        template: isFalseBranch
          ? '${symbol} condition not met (${price_change}%)'
          : '🚀 ${symbol} Breakout: +${price_change}% at Rp${price}',
        messageTemplate: isFalseBranch
          ? '${symbol} condition not met (${price_change}%)'
          : '🚀 ${symbol} Breakout: +${price_change}% at Rp${price}',
      };
    case 'watcher':
      return {
        symbol: symbol || '',
        metric: 'price_change',
        interval: 60,
      };
    case 'screener':
      return {
        query: 'top 5 banks by market cap',
        limit: 5,
      };
    case 'file':
      return {
        title: `${symbol} Research Brief`,
        filename: `${symbol}_Report.pdf`,
        fileType: 'pdf',
        isDownloaded: false,
      };
    case 'text':
      return {
        content: '# New Analysis',
        fontSize: 'header',
        alignment: 'left',
      };
    case 'sticker':
      return {
        emoji: isFalseBranch ? '🔻' : '🚀',
        label: isFalseBranch ? 'Neutral / Ignored' : 'Breakout Ready',
        color: isFalseBranch ? 'rose' : 'mint',
      };
    default:
      return {};
  }
}
