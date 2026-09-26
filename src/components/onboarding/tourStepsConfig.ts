export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector or data-tour attribute (undefined for modal / center steps)
  placement: 'center' | 'top' | 'bottom' | 'left' | 'right';
  badge: string;           // e.g. "Step 1 of 6"
  icon: string;            // MingCute icon name
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Scriffle',
    description: 'An event-driven visual whiteboard for Indonesian stock market research. Build automated node pipelines that monitor live IDX ticks, evaluate condition rules, and auto-mutate notes in real time.',
    placement: 'center',
    badge: 'Step 1 of 6',
    icon: 'magic_line',
  },
  {
    id: 'toolbar-and-search',
    title: 'Node Library & Curated Stocks',
    description: 'Add Watchers, AI Screeners, Conditions, Notes, and File attachments. Watchers include instant search across 150+ curated IDX stocks, and File cards let you attach research PDFs, filings, and spreadsheets directly to map your thesis.',
    targetSelector: '[data-tour="nav-toolbar"]',
    placement: 'top',
    badge: 'Step 2 of 6',
    icon: 'layout_grid_line',
  },
  {
    id: 'connections-and-logic',
    title: 'Auto-Wiring & Branching Rules',
    description: 'Hover any card\'s output handle and click [+] to quickly branch your flow. Conditions support dual True (green) and False (rose) pathways to trigger alerts, notes, or peer watchers automatically.',
    targetSelector: '[data-tour="market-canvas"]',
    placement: 'center',
    badge: 'Step 3 of 6',
    icon: 'git_commit_line',
  },
  {
    id: 'simulation-and-stream',
    title: 'Live Engine & Market Stream',
    description: 'Test your whiteboard instantly in the Control Panel. Click "Do Once" for a single live/mock poll tick, or toggle continuous data streaming to watch your notes and activity feed update dynamically.',
    targetSelector: '[data-tour="simulation-bar"]',
    placement: 'right',
    badge: 'Step 4 of 6',
    icon: 'play_circle_line',
  },
  {
    id: 'superpowers-and-shortcuts',
    title: 'Spotlight Search & Themes',
    description: 'Press Ctrl+K anytime for fuzzy Spotlight search across all cards, customize themes (Light, Mono, Dark, or Bloomberg .scrifflemes), and explore pre-built templates in the Control Panel.',
    targetSelector: '[data-tour="top-nav-actions"]',
    placement: 'bottom',
    badge: 'Step 5 of 6',
    icon: 'command_line',
  },
  {
    id: 'tutorial-bridge',
    title: 'Ready to Build?',
    description: 'Take the 6-mission guided challenge to build a real pipeline with research files, custom rules, and live simulations directly on this canvas.',
    targetSelector: '[data-tour="tutorial-btn"]',
    placement: 'bottom',
    badge: 'Step 6 of 6',
    icon: 'target_line',
  },
];
