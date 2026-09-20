import {
  ScriffleTheme,
  DEFAULT_DARK_THEME_FALLBACK,
  DEFAULT_LIGHT_THEME_FALLBACK,
  ThemeMode,
} from '@/types/theme';

/**
 * Sanitizes a color value (supports hex, rgb, rgba, hsl, or named colors).
 */
export function sanitizeColor(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  const trimmed = val.trim().replace(/^["']|["']$/g, '').trim();
  if (!trimmed) return fallback;

  // Basic color validation: hex #..., rgb(...), rgba(...), hsl(...), or clean css token
  if (/^#([0-9a-fA-F]{3,8})$/.test(trimmed)) return trimmed;
  if (/^(rgb|rgba|hsl|hsla)\(.*\)$/i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z]+$/.test(trimmed)) return trimmed;

  return fallback;
}

/**
 * Strips comments starting with '#' or ';' unless part of a color hex or quoted string.
 */
function cleanConfigLine(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith(';') || (trimmed.startsWith('#') && !/^#([0-9a-fA-F]{3,8})\b/.test(trimmed))) {
    return '';
  }

  // Handle inline comments
  let insideQuote: string | null = null;
  let cleanLine = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if ((char === '"' || char === "'") && (i === 0 || line[i - 1] !== '\\')) {
      if (!insideQuote) insideQuote = char;
      else if (insideQuote === char) insideQuote = null;
    }

    // Check if '#' or ';' is a comment:
    // It's a comment if it's ';' or if it's '#' preceded by whitespace AND not forming a hex color #RGB / #RRGGBB
    if (!insideQuote) {
      if (char === ';') {
        break;
      }
      if (char === '#') {
        // If it follows whitespace or is followed by non-hex characters (like space), it's a comment
        const remaining = line.slice(i);
        const isHexColor = /^#([0-9a-fA-F]{3,8})\b/.test(remaining);
        const precededByWhitespace = i > 0 && /\s/.test(line[i - 1]);
        const followedByWhitespace = i + 1 < line.length && /\s/.test(line[i + 1]);

        if (followedByWhitespace || (!isHexColor && precededByWhitespace) || (!isHexColor && i === 0)) {
          break;
        }
      }
    }
    cleanLine += char;
  }
  return cleanLine.trim();
}

/**
 * Generates a URL-friendly ID slug from a theme name.
 */
export function slugifyThemeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'custom-theme';
}

/**
 * Parses raw .scrifflemes INI/conf string into a structured ScriffleTheme object.
 */
export function parseScriffleTheme(rawText: string, fallbackId?: string): ScriffleTheme {
  const lines = rawText.split(/\r?\n/);
  let currentSection = 'metadata';
  const parsedSections: Record<string, Record<string, string>> = {
    metadata: {},
    canvas: {},
    ui: {},
    nodes: {},
    edges: {},
  };

  for (const line of lines) {
    const clean = cleanConfigLine(line);
    if (!clean) continue;

    // Check for section header: [section]
    const sectionMatch = clean.match(/^\[([a-zA-Z0-9_-]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase();
      if (!parsedSections[currentSection]) {
        parsedSections[currentSection] = {};
      }
      continue;
    }

    // Key = Value
    const equalIdx = clean.indexOf('=');
    if (equalIdx !== -1) {
      const key = clean.slice(0, equalIdx).trim().toLowerCase();
      let value = clean.slice(equalIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1).trim();
      }
      if (key && currentSection) {
        parsedSections[currentSection] = parsedSections[currentSection] || {};
        parsedSections[currentSection][key] = value;
      }
    }
  }

  const metaRaw = parsedSections.metadata || {};
  const name = metaRaw.name || metaRaw.theme_name || 'Custom Theme';
  const modeBase = (metaRaw.mode_base?.toLowerCase() === 'light' ? 'light' : 'dark') as 'light' | 'dark';
  const fallback = modeBase === 'light' ? DEFAULT_LIGHT_THEME_FALLBACK : DEFAULT_DARK_THEME_FALLBACK;

  const canvasRaw = parsedSections.canvas || {};
  const uiRaw = parsedSections.ui || {};
  const nodesRaw = parsedSections.nodes || {};
  const edgesRaw = parsedSections.edges || {};

  const id = fallbackId || slugifyThemeName(name);

  return {
    id,
    metadata: {
      name,
      author: metaRaw.author || 'Scriffle Community',
      version: metaRaw.version || '1.0.0',
      description: metaRaw.description || '',
      mode_base: modeBase,
    },
    canvas: {
      background: sanitizeColor(canvasRaw.background || canvasRaw.bg, fallback.canvas.background),
      grid_dot: sanitizeColor(canvasRaw.grid_dot || canvasRaw.dot, fallback.canvas.grid_dot),
      selection_box: sanitizeColor(canvasRaw.selection_box || canvasRaw.select, fallback.canvas.selection_box),
      selection_box_fill: canvasRaw.selection_box_fill || fallback.canvas.selection_box_fill,
    },
    ui: {
      primary: sanitizeColor(uiRaw.primary || uiRaw.accent, fallback.ui.primary),
      surface: sanitizeColor(uiRaw.surface || uiRaw.panel_bg, fallback.ui.surface),
      surface_muted: sanitizeColor(uiRaw.surface_muted || uiRaw.surface_secondary, fallback.ui.surface_muted),
      border: sanitizeColor(uiRaw.border || uiRaw.border_color, fallback.ui.border),
      border_active: sanitizeColor(uiRaw.border_active, fallback.ui.border_active || fallback.ui.primary),
      text: sanitizeColor(uiRaw.text || uiRaw.foreground, fallback.ui.text),
      text_muted: sanitizeColor(uiRaw.text_muted || uiRaw.muted, fallback.ui.text_muted),
      tape: sanitizeColor(uiRaw.tape, fallback.ui.tape || fallback.ui.surface_muted),
    },
    nodes: {
      surface_card: sanitizeColor(nodesRaw.surface_card || nodesRaw.card_bg, fallback.nodes.surface_card),
      border_card: sanitizeColor(nodesRaw.border_card || nodesRaw.card_border, fallback.nodes.border_card),
      watcher: sanitizeColor(nodesRaw.watcher, fallback.nodes.watcher || '#10B981'),
      condition: sanitizeColor(nodesRaw.condition, fallback.nodes.condition || '#FFD728'),
      alert: sanitizeColor(nodesRaw.alert, fallback.nodes.alert || '#FF5B79'),
      screener: sanitizeColor(nodesRaw.screener, fallback.nodes.screener || '#0050FF'),
      action: sanitizeColor(nodesRaw.action, fallback.nodes.action || '#8B5CF6'),
      note_default: sanitizeColor(nodesRaw.note_default || nodesRaw.note, fallback.nodes.note_default || '#FEF08A'),
      text_default: sanitizeColor(nodesRaw.text_default, fallback.nodes.text_default || fallback.ui.text),
    },
    edges: {
      default: sanitizeColor(edgesRaw.default || edgesRaw.wire, fallback.edges.default),
      active: sanitizeColor(edgesRaw.active || edgesRaw.pulse, fallback.edges.active || fallback.ui.primary),
      selected: sanitizeColor(edgesRaw.selected, fallback.edges.selected || '#EF4444'),
    },
  };
}

/**
 * Serializes a ScriffleTheme into clean .scrifflemes text format.
 */
export function serializeScriffleTheme(theme: ScriffleTheme): string {
  return `# Scriffle Theme Configuration
# Generated by Scriffle Theme Engine

[metadata]
name = "${theme.metadata.name}"
author = "${theme.metadata.author || 'Anonymous'}"
version = "${theme.metadata.version || '1.0.0'}"
mode_base = "${theme.metadata.mode_base}"

[canvas]
background = ${theme.canvas.background}
grid_dot = ${theme.canvas.grid_dot}
selection_box = ${theme.canvas.selection_box}
selection_box_fill = ${theme.canvas.selection_box_fill || ''}

[ui]
primary = ${theme.ui.primary}
surface = ${theme.ui.surface}
surface_muted = ${theme.ui.surface_muted}
border = ${theme.ui.border}
border_active = ${theme.ui.border_active || theme.ui.primary}
text = ${theme.ui.text}
text_muted = ${theme.ui.text_muted}
tape = ${theme.ui.tape || ''}

[nodes]
surface_card = ${theme.nodes.surface_card}
border_card = ${theme.nodes.border_card}
watcher = ${theme.nodes.watcher || ''}
condition = ${theme.nodes.condition || ''}
alert = ${theme.nodes.alert || ''}
screener = ${theme.nodes.screener || ''}
action = ${theme.nodes.action || ''}
note_default = ${theme.nodes.note_default || ''}
text_default = ${theme.nodes.text_default || ''}

[edges]
default = ${theme.edges.default}
active = ${theme.edges.active || theme.ui.primary}
selected = ${theme.edges.selected || '#EF4444'}
`;
}

/**
 * Converts a ScriffleTheme to a map of CSS custom properties.
 */
export function themeToCssVariables(theme: ScriffleTheme): Record<string, string> {
  return {
    '--custom-canvas-bg': theme.canvas.background,
    '--custom-canvas-dot': theme.canvas.grid_dot,
    '--custom-selection-box': theme.canvas.selection_box,
    '--custom-selection-box-fill': theme.canvas.selection_box_fill || 'rgba(0, 80, 255, 0.15)',
    '--custom-ui-primary': theme.ui.primary,
    '--custom-ui-surface': theme.ui.surface,
    '--custom-ui-surface-muted': theme.ui.surface_muted,
    '--custom-ui-border': theme.ui.border,
    '--custom-ui-border-active': theme.ui.border_active || theme.ui.primary,
    '--custom-ui-text': theme.ui.text,
    '--custom-ui-text-muted': theme.ui.text_muted,
    '--custom-ui-tape': theme.ui.tape || theme.ui.surface_muted,
    '--custom-node-card-bg': theme.nodes.surface_card,
    '--custom-node-card-border': theme.nodes.border_card,
    '--custom-node-watcher': theme.nodes.watcher || '#10B981',
    '--custom-node-condition': theme.nodes.condition || '#FFD728',
    '--custom-node-alert': theme.nodes.alert || '#FF5B79',
    '--custom-node-screener': theme.nodes.screener || '#0050FF',
    '--custom-node-action': theme.nodes.action || '#8B5CF6',
    '--custom-node-note-default': theme.nodes.note_default || '#FEF08A',
    '--custom-node-text-default': theme.nodes.text_default || theme.ui.text,
    '--custom-edge-default': theme.edges.default,
    '--custom-edge-active': theme.edges.active || theme.ui.primary,
    '--custom-edge-selected': theme.edges.selected || '#EF4444',
  };
}

/**
 * Injects CSS variables directly onto document element for custom themes.
 */
export function applyThemeToDocument(theme: ScriffleTheme | null, mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', mode);

  if (mode === 'custom' && theme) {
    const vars = themeToCssVariables(theme);
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  } else {
    // Clean custom vars if switching to built-in modes
    const allCustomProps = [
      '--custom-canvas-bg',
      '--custom-canvas-dot',
      '--custom-selection-box',
      '--custom-selection-box-fill',
      '--custom-ui-primary',
      '--custom-ui-surface',
      '--custom-ui-surface-muted',
      '--custom-ui-border',
      '--custom-ui-border-active',
      '--custom-ui-text',
      '--custom-ui-text-muted',
      '--custom-ui-tape',
      '--custom-node-card-bg',
      '--custom-node-card-border',
      '--custom-node-watcher',
      '--custom-node-condition',
      '--custom-node-alert',
      '--custom-node-screener',
      '--custom-node-action',
      '--custom-node-note-default',
      '--custom-node-text-default',
      '--custom-edge-default',
      '--custom-edge-active',
      '--custom-edge-selected',
    ];
    for (const prop of allCustomProps) {
      root.style.removeProperty(prop);
    }
  }
}
