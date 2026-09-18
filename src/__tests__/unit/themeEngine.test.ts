import { describe, it, expect } from 'vitest';
import {
  parseScriffleTheme,
  serializeScriffleTheme,
  themeToCssVariables,
  sanitizeColor,
  slugifyThemeName,
} from '@/lib/themeParser';
import { DEFAULT_DARK_THEME_FALLBACK, DEFAULT_LIGHT_THEME_FALLBACK } from '@/types/theme';

describe('Scriffle Theme Engine — Parser & Serializer', () => {
  const SAMPLE_BLOOMBERG_THEME = `
# Scriffle Theme Configuration
# Bloomberg Terminal Style

[metadata]
name = "Bloomberg Terminal"
author = "Scriffle Core"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #121212
grid_dot = #2A2A2A
selection_box = #FF8C00
selection_box_fill = #FF8C0018

[ui]
primary = #FF8C00
surface = #1A1A1A
surface_muted = #242424
border = #333333
border_active = #FF8C00
text = #FF9E00
text_muted = #B07200
tape = #262014

[nodes]
surface_card = #181818
border_card = #2E2E2E
watcher = #00C853
condition = #FFAB00
alert = #FF3D00
screener = #FF8C00
action = #D500F9
note_default = #222018
text_default = #FF9E00

[edges]
default = #734800
active = #FF8C00
selected = #FFD600
`;

  it('parses a valid .scrifflemes configuration string correctly', () => {
    const theme = parseScriffleTheme(SAMPLE_BLOOMBERG_THEME);

    expect(theme.id).toBe('bloomberg-terminal');
    expect(theme.metadata.name).toBe('Bloomberg Terminal');
    expect(theme.metadata.author).toBe('Scriffle Core');
    expect(theme.metadata.mode_base).toBe('dark');

    expect(theme.canvas.background).toBe('#121212');
    expect(theme.canvas.grid_dot).toBe('#2A2A2A');
    expect(theme.canvas.selection_box).toBe('#FF8C00');

    expect(theme.ui.primary).toBe('#FF8C00');
    expect(theme.ui.surface).toBe('#1A1A1A');
    expect(theme.ui.text).toBe('#FF9E00');

    expect(theme.nodes.watcher).toBe('#00C853');
    expect(theme.nodes.condition).toBe('#FFAB00');
    expect(theme.nodes.surface_card).toBe('#181818');

    expect(theme.edges.default).toBe('#734800');
    expect(theme.edges.active).toBe('#FF8C00');
    expect(theme.edges.selected).toBe('#FFD600');
  });

  it('handles inline comments and whitespace gracefully', () => {
    const raw = `
[metadata]
name = "Cyberpunk Neon" # Main title comment
mode_base = dark ; semicolon comment

[canvas]
background = #0F1014 # Deep dark
grid_dot = #2A2D37
`;
    const theme = parseScriffleTheme(raw);
    expect(theme.metadata.name).toBe('Cyberpunk Neon');
    expect(theme.canvas.background).toBe('#0F1014');
    expect(theme.canvas.grid_dot).toBe('#2A2D37');
  });

  it('applies light mode fallbacks when mode_base = "light" and fields are missing', () => {
    const raw = `
[metadata]
name = "Paper Minimal"
mode_base = "light"

[canvas]
background = #FFFFFF
`;
    const theme = parseScriffleTheme(raw);
    expect(theme.metadata.mode_base).toBe('light');
    expect(theme.canvas.background).toBe('#FFFFFF');
    // Check fallback values
    expect(theme.ui.primary).toBe(DEFAULT_LIGHT_THEME_FALLBACK.ui.primary);
    expect(theme.nodes.surface_card).toBe(DEFAULT_LIGHT_THEME_FALLBACK.nodes.surface_card);
  });

  it('applies dark mode fallbacks when mode_base = "dark" and fields are missing', () => {
    const raw = `
[metadata]
name = "Simple Dark"
mode_base = "dark"
`;
    const theme = parseScriffleTheme(raw);
    expect(theme.metadata.mode_base).toBe('dark');
    expect(theme.canvas.background).toBe(DEFAULT_DARK_THEME_FALLBACK.canvas.background);
    expect(theme.ui.surface).toBe(DEFAULT_DARK_THEME_FALLBACK.ui.surface);
  });

  it('sanitizes invalid color strings and falls back to safe colors', () => {
    expect(sanitizeColor('invalid!color$$', '#121212')).toBe('#121212');
    expect(sanitizeColor('#FF00AA', '#121212')).toBe('#FF00AA');
    expect(sanitizeColor('rgba(255, 0, 0, 0.5)', '#121212')).toBe('rgba(255, 0, 0, 0.5)');
    expect(sanitizeColor('  " #0050FF " ', '#121212')).toBe('#0050FF');
  });

  it('slugifies theme names cleanly for IDs', () => {
    expect(slugifyThemeName('Bloomberg Terminal v2')).toBe('bloomberg-terminal-v2');
    expect(slugifyThemeName('  Tokyo Night (Special!)  ')).toBe('tokyo-night-special');
    expect(slugifyThemeName('')).toBe('custom-theme');
  });

  it('round-trips serialization and parsing without loss of properties', () => {
    const original = parseScriffleTheme(SAMPLE_BLOOMBERG_THEME);
    const serialized = serializeScriffleTheme(original);
    const roundTripped = parseScriffleTheme(serialized);

    expect(roundTripped.metadata.name).toBe(original.metadata.name);
    expect(roundTripped.canvas.background).toBe(original.canvas.background);
    expect(roundTripped.ui.primary).toBe(original.ui.primary);
    expect(roundTripped.nodes.watcher).toBe(original.nodes.watcher);
    expect(roundTripped.edges.default).toBe(original.edges.default);
  });

  it('generates complete CSS variable mappings from a theme', () => {
    const theme = parseScriffleTheme(SAMPLE_BLOOMBERG_THEME);
    const cssVars = themeToCssVariables(theme);

    expect(cssVars['--custom-canvas-bg']).toBe('#121212');
    expect(cssVars['--custom-canvas-dot']).toBe('#2A2A2A');
    expect(cssVars['--custom-ui-primary']).toBe('#FF8C00');
    expect(cssVars['--custom-ui-surface']).toBe('#1A1A1A');
    expect(cssVars['--custom-node-watcher']).toBe('#00C853');
    expect(cssVars['--custom-edge-default']).toBe('#734800');
  });
});
