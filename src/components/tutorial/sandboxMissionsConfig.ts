export interface MissionDefinition {
  id: string;
  title: string;
  shortDesc: string;
  detailHint: string;
  badge: string;
  icon: string;
  actionCta?: string;
  targetTourTag?: string;
}

export const SANDBOX_MISSIONS: MissionDefinition[] = [
  {
    id: 'mission-watcher-stock',
    title: 'Deploy Watcher & Pick an IDX Stock',
    shortDesc: 'Drop a Watcher card from the toolbar and pick an Indonesian stock (e.g. BBCA, BMRI, TLKM).',
    detailHint: 'Click "Watcher" in the bottom toolbar, double-click the card or use the curated search combobox to select any Indonesian company.',
    badge: 'Mission 01',
    icon: 'radar_line',
    targetTourTag: 'nav-toolbar',
  },
  {
    id: 'mission-file-research',
    title: 'Map Research with a File Attachment',
    shortDesc: 'Drop a File card to anchor your investment thesis, research PDF, or financial model.',
    detailHint: 'Click Elements → File or drag any PDF / research document onto the canvas. Files are first-class research anchors, not just export outputs!',
    badge: 'Mission 02',
    icon: 'attachment_line',
    targetTourTag: 'nav-toolbar',
  },
  {
    id: 'mission-wire-condition',
    title: 'Auto-Wire a Condition Rule (+)',
    shortDesc: 'Hover the Watcher\'s output port and click [+] to create a connected Condition rule.',
    detailHint: 'Hover near the right edge of your Watcher card, click the floating [+] handle button, and select "Condition" from the popover to auto-wire without dragging.',
    badge: 'Mission 03',
    icon: 'filter_line',
    targetTourTag: 'market-canvas',
  },
  {
    id: 'mission-branch-output',
    title: 'Branch to a Sticky Note or Discord Alert',
    shortDesc: 'Connect the True (Emerald) handle of your Condition to a Sticky Note or Discord Alert.',
    detailHint: 'Click [+] on the upper Emerald "True" handle of your Condition node to branch into a dynamic Sticky Note or Discord Alert sticker.',
    badge: 'Mission 04',
    icon: 'quill_pen_line',
    targetTourTag: 'market-canvas',
  },
  {
    id: 'mission-freeform-annotation',
    title: 'Add Freeform Text (T) or Emoji Sticker',
    shortDesc: 'Press "T" to type freeform notes anywhere or drop an inline customizable Emoji Sticker.',
    detailHint: 'Press "T" on your keyboard to drop rich text at your cursor, or click "Sticker" in the toolbar to drop a customizable badge (e.g. 🚀 Breakout).',
    badge: 'Mission 05',
    icon: 'star_line',
    targetTourTag: 'nav-toolbar',
  },
  {
    id: 'mission-simulate-execution',
    title: 'Run Live Simulation (Do Once)',
    shortDesc: 'Open Control Panel and click "Do Once" to simulate a live market tick across your graph.',
    detailHint: 'Click "Controls" in the top navbar or open the Control Panel drawer, then click "Do Once" to watch live market data evaluate your conditions!',
    badge: 'Mission 06',
    icon: 'play_circle_line',
    targetTourTag: 'simulation-bar',
  },
];
