import { CanvasNodeData, NodeType } from '@/types/canvas';

export interface SearchResultItem {
  id: string;
  type: NodeType;
  title: string;
  subtitle: string;
  badge?: string;
  position: { x: number; y: number };
  score: number;
}

/**
 * Extracts searchable text fields from a canvas node data object
 */
export function extractNodeSearchText(node: CanvasNodeData): {
  title: string;
  subtitle: string;
  badge?: string;
  searchTokens: string[];
} {
  const cfg: any = node.config || {};
  const type = node.type;

  let title = '';
  let subtitle = '';
  let badge: string | undefined = undefined;
  const searchTokens: string[] = [type];

  switch (type) {
    case 'watcher': {
      const sym = cfg.symbol || 'BBCA';
      const metric = cfg.metric || 'price_change';
      const mode = cfg.mode || 'single';
      title = mode === 'top_gainers' ? 'Top Gainers Radar' : mode === 'top_losers' ? 'Top Losers Radar' : `${sym.toUpperCase()} Watcher`;
      subtitle = mode !== 'single' ? `Mode: ${mode} • Interval: ${cfg.interval || 300}s` : `Metric: ${metric} • Interval: ${cfg.interval || 300}s`;
      badge = mode !== 'single' ? (mode === 'top_gainers' ? 'Gainers' : 'Losers') : sym.toUpperCase();
      searchTokens.push(sym, metric, `${cfg.interval}s`, 'watcher', 'stock', 'radar', 'ticker');
      if (mode === 'top_gainers') searchTokens.push('top gainers', 'gainers', 'leaderboard');
      if (mode === 'top_losers') searchTokens.push('top losers', 'losers', 'leaderboard');
      break;
    }
    case 'screener': {
      const query = cfg.query || 'Screening companies';
      title = 'AI Company Screener';
      subtitle = `"${query}"`;
      badge = 'AI Screener';
      searchTokens.push('screener', 'ai', 'query', query, 'filter', 'companies');
      break;
    }
    case 'note': {
      const content = cfg.content || cfg.template || 'Sticky Note';
      const preview = content.replace(/\n/g, ' ').slice(0, 50);
      title = 'Sticky Note';
      subtitle = preview + (content.length > 50 ? '...' : '');
      badge = cfg.color ? `${cfg.color} note` : 'Note';
      searchTokens.push('note', 'sticky', content, cfg.template || '', cfg.color || '');
      break;
    }
    case 'text': {
      const text = cfg.text || 'Freeform text';
      const preview = text.replace(/\n/g, ' ').slice(0, 50);
      title = 'Free Text';
      subtitle = preview + (text.length > 50 ? '...' : '');
      badge = cfg.containerStyle ? `${cfg.containerStyle}` : 'Text';
      searchTokens.push('text', 'freeform', text, cfg.containerStyle || '');
      break;
    }
    case 'condition': {
      const rule = cfg.rule || 'Condition rule';
      title = 'Condition Rule';
      subtitle = rule;
      badge = 'DSL Rule';
      searchTokens.push('condition', 'rule', 'dsl', rule, 'filter');
      break;
    }
    case 'alert': {
      const channel = cfg.channel || 'ui';
      title = 'Alert Notification';
      subtitle = cfg.template || `Channel: ${channel.toUpperCase()}`;
      badge = channel.toUpperCase();
      searchTokens.push('alert', 'notification', channel, cfg.template || '', 'toast');
      break;
    }
    case 'action': {
      const actionType = cfg.action || 'create_note';
      const readableAction =
        actionType === 'fundamental_report'
          ? 'Fundamental Report'
          : actionType === 'create_watcher'
          ? 'Spawn Watcher'
          : actionType === 'create_note'
          ? 'Spawn Note'
          : 'Canvas Action';
      title = readableAction;
      subtitle = cfg.targetSymbol ? `Target: ${cfg.targetSymbol}` : `Action: ${actionType}`;
      badge = 'Automation';
      searchTokens.push('action', 'automation', actionType, readableAction, cfg.targetSymbol || '');
      break;
    }
    case 'file': {
      const fileName = cfg.fileName || 'Attachment';
      title = fileName;
      subtitle = `${cfg.fileCategory || 'File'} • ${cfg.fileSize || 'Local Document'}`;
      badge = cfg.savedLocally ? 'Saved' : 'File';
      searchTokens.push('file', 'document', fileName, cfg.fileCategory || '', 'attachment', 'pdf', 'report');
      break;
    }
    case 'sticker': {
      const stickerType = cfg.stickerType || 'rocket';
      title = `Sticker: ${stickerType}`;
      subtitle = 'Canvas badge marker';
      badge = stickerType;
      searchTokens.push('sticker', 'badge', stickerType, 'marker');
      break;
    }
    case 'image': {
      title = cfg.caption || 'Image';
      subtitle = cfg.isTransparent ? 'Transparent PNG' : 'Canvas image';
      badge = 'Image';
      searchTokens.push('image', 'photo', 'picture', cfg.caption || '');
      break;
    }
    default: {
      title = `${type} node`;
      subtitle = 'Canvas element';
      searchTokens.push(type);
      break;
    }
  }

  return { title, subtitle, badge, searchTokens };
}

/**
 * Searches canvas nodes matching a query string
 */
export function searchCanvasNodes(nodes: CanvasNodeData[], query: string): SearchResultItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!nodes || nodes.length === 0) return [];

  // If query is empty, return all nodes in natural order up to 15
  if (!trimmed) {
    return nodes.slice(0, 15).map((node) => {
      const { title, subtitle, badge } = extractNodeSearchText(node);
      return {
        id: node.id,
        type: node.type,
        title,
        subtitle,
        badge,
        position: node.position,
        score: 1,
      };
    });
  }

  const queryTerms = trimmed.split(/\s+/).filter(Boolean);
  const results: SearchResultItem[] = [];

  for (const node of nodes) {
    const { title, subtitle, badge, searchTokens } = extractNodeSearchText(node);
    const combinedContent = `${title} ${subtitle} ${badge || ''} ${searchTokens.join(' ')}`.toLowerCase();

    let score = 0;
    let allMatched = true;

    for (const term of queryTerms) {
      if (title.toLowerCase().includes(term)) {
        score += 10;
        if (title.toLowerCase().startsWith(term)) {
          score += 5;
        }
      } else if (badge?.toLowerCase().includes(term)) {
        score += 8;
      } else if (subtitle.toLowerCase().includes(term)) {
        score += 5;
      } else if (combinedContent.includes(term)) {
        score += 2;
      } else {
        allMatched = false;
        break;
      }
    }

    if (allMatched && score > 0) {
      results.push({
        id: node.id,
        type: node.type,
        title,
        subtitle,
        badge,
        position: node.position,
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
