export type NodeType =
  | 'watcher'
  | 'condition'
  | 'note'
  | 'alert'
  | 'action'
  | 'text'
  | 'image'
  | 'sticker';

export interface WatcherConfig {
  symbol: string;         // e.g. "BBCA", "BBRI", "BMRI"
  metric: 'price' | 'price_change' | 'volume' | 'rank';
  interval: number;       // in seconds, e.g. 300
}

export interface ConditionConfig {
  rule: string;           // e.g. "price_change > 5 AND volume > 1000000"
}

export interface NoteConfig {
  content: string;        // Text content
  template?: string;      // e.g. "${symbol} surged ${price_change}% at ${timestamp}"
  color?: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple';
}

export interface AlertConfig {
  channel: 'ui' | 'telegram' | 'webhook';
  messageTemplate?: string;
}

export interface ActionConfig {
  action: 'create_note' | 'create_watcher' | 'export_canvas';
  params?: Record<string, any>;
}

export interface TextConfig {
  text: string;
  fontSize?: 'small' | 'medium' | 'large';
  color?: string;
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

export type NodeConfig =
  | WatcherConfig
  | ConditionConfig
  | NoteConfig
  | AlertConfig
  | ActionConfig
  | TextConfig
  | ImageConfig
  | StickerConfig;

export interface CanvasNodeData {
  id: string;
  canvasId: string;
  type: NodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  state?: {
    cycleCount?: number;
    lastTriggeredAt?: string;
    lastValue?: any;
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
  price: number;
  prevPrice: number;
  price_change: number; // Percentage e.g. 6.2 for +6.2%
  volume: number;
  avg_volume: number;
  rank?: number;
  rank_change?: number;
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
