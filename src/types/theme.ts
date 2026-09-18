export type ThemeMode = 'light' | 'mono' | 'dark' | 'custom';

export interface ScriffleThemeMetadata {
  name: string;
  author?: string;
  version?: string;
  description?: string;
  mode_base: 'light' | 'dark';
}

export interface ScriffleThemeCanvas {
  background: string;
  grid_dot: string;
  selection_box: string;
  selection_box_fill?: string;
}

export interface ScriffleThemeUI {
  primary: string;
  surface: string;
  surface_muted: string;
  border: string;
  border_active?: string;
  text: string;
  text_muted: string;
  tape?: string;
}

export interface ScriffleThemeNodes {
  surface_card: string;
  border_card: string;
  watcher?: string;
  condition?: string;
  alert?: string;
  screener?: string;
  action?: string;
  note_default?: string;
  text_default?: string;
}

export interface ScriffleThemeEdges {
  default: string;
  active?: string;
  selected?: string;
}

export interface ScriffleTheme {
  id: string;
  isBuiltin?: boolean;
  metadata: ScriffleThemeMetadata;
  canvas: ScriffleThemeCanvas;
  ui: ScriffleThemeUI;
  nodes: ScriffleThemeNodes;
  edges: ScriffleThemeEdges;
}

export const DEFAULT_DARK_THEME_FALLBACK: Omit<ScriffleTheme, 'id' | 'metadata'> = {
  canvas: {
    background: '#0F1014',
    grid_dot: '#252730',
    selection_box: '#0050FF',
    selection_box_fill: 'rgba(0, 80, 255, 0.12)',
  },
  ui: {
    primary: '#0050FF',
    surface: '#14151B',
    surface_muted: '#1E2028',
    border: '#252730',
    border_active: '#0050FF',
    text: '#E2E4E9',
    text_muted: '#8E919E',
    tape: '#242630',
  },
  nodes: {
    surface_card: '#1A1B22',
    border_card: '#2C2E3A',
    watcher: '#10B981',
    condition: '#FFD728',
    alert: '#FF5B79',
    screener: '#0050FF',
    action: '#8B5CF6',
    note_default: '#2D2B1E',
    text_default: '#E2E4E9',
  },
  edges: {
    default: '#5A5E6F',
    active: '#0050FF',
    selected: '#C8CBD5',
  },
};

export const DEFAULT_LIGHT_THEME_FALLBACK: Omit<ScriffleTheme, 'id' | 'metadata'> = {
  canvas: {
    background: '#F8F9FC',
    grid_dot: '#CBD5E1',
    selection_box: '#0050FF',
    selection_box_fill: 'rgba(0, 80, 255, 0.08)',
  },
  ui: {
    primary: '#0050FF',
    surface: '#FFFFFF',
    surface_muted: '#F1F5F9',
    border: '#E2E8F0',
    border_active: '#0050FF',
    text: '#0F172A',
    text_muted: '#64748B',
    tape: 'rgba(255, 255, 255, 0.85)',
  },
  nodes: {
    surface_card: '#FFFFFF',
    border_card: '#CBD5E1',
    watcher: '#10B981',
    condition: '#FFD728',
    alert: '#FF5B79',
    screener: '#0050FF',
    action: '#0050FF',
    note_default: '#FEF08A',
    text_default: '#0F172A',
  },
  edges: {
    default: '#0050FF',
    active: '#0050FF',
    selected: '#EF4444',
  },
};
