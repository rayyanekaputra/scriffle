export type NodeType =
  | 'watcher'
  | 'condition'
  | 'note'
  | 'alert'
  | 'action'
  | 'text'
  | 'image'
  | 'sticker'
  | 'file';

export type CanvasToolMode = 'select' | 'hand';

export interface WatcherConfig {
  symbol: string;         // e.g. "BBCA", "BBRI", "BMRI"
  metric: 'price' | 'price_change' | 'volume' | 'rank';
  interval: number;       // in seconds, e.g. 300
  mode?: 'single' | 'top_gainers' | 'top_losers';
  threshold?: number;     // e.g. 5 for 5% move
  limit?: number;         // e.g. 3 for Top 3, 5 for Top 5, 10 for Top 10 (defaults to 5)
  period?: '1d' | '7d' | '14d' | '30d' | '365d' | 'all'; // e.g. "1d" (defaults to "1d")
  minMcapBillion?: number; // e.g. 5000 for 5,000 Billion IDR
  classifications?: string; // e.g. "all"
}

export interface ConditionConfig {
  rule: string;           // e.g. "price_change > 5 AND volume > 1000000"
}

export interface NoteConfig {
  content: string;        // Text content
  template?: string;      // e.g. "${symbol} surged ${price_change}% at ${timestamp}"
  color?: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple';
  width?: number;
  height?: number;
}

export interface AlertConfig {
  channel: 'ui' | 'telegram' | 'webhook';
  messageTemplate?: string;
}

export interface ActionConfig {
  action: 'create_note' | 'create_watcher' | 'fundamental_report' | 'export_canvas';
  params?: Record<string, any>;
}

export type TextFontSize = 'title' | 'header' | 'body' | 'caption' | 'small' | 'medium' | 'large';
export type TextAlignment = 'left' | 'center' | 'right';
export type TextContainerStyle = 'plain' | 'callout' | 'card';
export type TextHighlightColor = 'none' | 'yellow' | 'mint' | 'coral' | 'purple';

export interface TextConfig {
  text: string;
  fontSize?: TextFontSize;
  align?: TextAlignment;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  highlight?: TextHighlightColor;
  containerStyle?: TextContainerStyle;
  color?: string;
  width?: number;
  height?: number;
}

export interface ImageConfig {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
  isTransparent?: boolean;
}

export interface StickerConfig {
  stickerType: 'bullish' | 'bearish' | 'rocket' | 'target' | 'star' | 'warning' | 'approved';
  size?: number;
}

export type FileCategory =
  | 'pdf'
  | 'presentation'
  | 'document'
  | 'spreadsheet'
  | 'audio'
  | 'code'
  | 'archive'
  | 'generic';

export interface FileConfig {
  fileName: string;
  fileUrl: string;
  filePath?: string;        // Local file path on disk (e.g. /home/user/Downloads/report.pdf)
  fileSize?: string;
  fileCategory?: FileCategory;
  extension?: string;
  caption?: string;
  savedLocally?: boolean;
  isDownloaded?: boolean;
  downloadedAt?: string;
  createdAt?: string;
}

export interface BaseNodeConfig {
  _groupId?: string | null;
  _groupName?: string | null;
  [key: string]: any;
}

export type NodeConfig = (
  | WatcherConfig
  | ConditionConfig
  | NoteConfig
  | AlertConfig
  | ActionConfig
  | TextConfig
  | ImageConfig
  | StickerConfig
  | FileConfig
) & BaseNodeConfig;

export interface CanvasNodeData {
  id: string;
  canvasId: string;
  groupId?: string | null;
  groupName?: string | null;
  type: NodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  state?: {
    cycleCount?: number;
    lastTriggeredAt?: string;
    lastValue?: any;
    movers?: MarketEvent[];
    status?: 'idle' | 'running' | 'passed' | 'failed' | 'error';
    error?: string;
  };
}

export interface CanvasEdgeData {
  id: string;
  canvasId: string;
  from: string; // source node ID
  to: string;   // target node ID
}

export interface MarketEvent {
  symbol: string;
  name?: string;
  price: number;
  prevPrice: number;
  price_change: number; // Percentage e.g. 6.2 for +6.2%
  volume: number;
  avg_volume: number;
  rank?: number;
  rank_change?: number;
  period?: string;
  timestamp: string;
}

export interface ExecutionLog {
  id: string;
  canvasId: string;
  eventSummary: string;
  triggeredNodes: string[];
  details?: Record<string, any>;
  createdAt: string;
}

export interface CanvasData {
  id: string;
  name: string;
  nodes: CanvasNodeData[];
  edges: CanvasEdgeData[];
  logs?: ExecutionLog[];
}
