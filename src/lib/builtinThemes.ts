import { ScriffleTheme } from '@/types/theme';
import { parseScriffleTheme } from '@/lib/themeParser';

export const BLOOMBERG_THEME_RAW = `
[metadata]
name = "Bloomberg Terminal"
author = "Scriffle Core"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #121212
grid_dot = #2A2A2A
selection_box = #FF8C00
selection_box_fill = rgba(255, 140, 0, 0.12)

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

export const NORD_THEME_RAW = `
[metadata]
name = "Nord Frost"
author = "Arctic IceStudio"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #242933
grid_dot = #3B4252
selection_box = #88C0D0
selection_box_fill = rgba(136, 192, 208, 0.12)

[ui]
primary = #88C0D0
surface = #2E3440
surface_muted = #3B4252
border = #434C5E
border_active = #88C0D0
text = #ECEFF4
text_muted = #D8DEE9
tape = #3B4252

[nodes]
surface_card = #2E3440
border_card = #434C5E
watcher = #A3BE8C
condition = #EBCB8B
alert = #BF616A
screener = #81A1C1
action = #B48EAD
note_default = #3B4252
text_default = #ECEFF4

[edges]
default = #4C566A
active = #88C0D0
selected = #EBCB8B
`;

export const GRUVBOX_THEME_RAW = `
[metadata]
name = "Gruvbox Dark"
author = "morhetz"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #1D2021
grid_dot = #32302F
selection_box = #FE8019
selection_box_fill = rgba(254, 128, 25, 0.12)

[ui]
primary = #FE8019
surface = #282828
surface_muted = #3C3836
border = #504945
border_active = #FE8019
text = #EBDBB2
text_muted = #A89984
tape = #3C3836

[nodes]
surface_card = #282828
border_card = #504945
watcher = #B8BB26
condition = #FABD2F
alert = #FB4934
screener = #83A598
action = #D3869B
note_default = #32302F
text_default = #EBDBB2

[edges]
default = #665C54
active = #FE8019
selected = #FABD2F
`;

export const TOKYO_NIGHT_THEME_RAW = `
[metadata]
name = "Tokyo Night"
author = "enkia"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #16161E
grid_dot = #24283B
selection_box = #7AA2F7
selection_box_fill = rgba(122, 162, 247, 0.12)

[ui]
primary = #7AA2F7
surface = #1A1B26
surface_muted = #24283B
border = #2F354A
border_active = #7AA2F7
text = #C0CAF5
text_muted = #7982A9
tape = #24283B

[nodes]
surface_card = #1A1B26
border_card = #2F354A
watcher = #9ECE6A
condition = #E0AF68
alert = #F7768E
screener = #7AA2F7
action = #BB9AF7
note_default = #1F2335
text_default = #C0CAF5

[edges]
default = #414868
active = #7AA2F7
selected = #E0AF68
`;

export const SOLARIZED_DARK_THEME_RAW = `
[metadata]
name = "Solarized Dark"
author = "Ethan Schoonover"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #00212B
grid_dot = #073642
selection_box = #2AA198
selection_box_fill = rgba(42, 161, 152, 0.12)

[ui]
primary = #2AA198
surface = #002B36
surface_muted = #073642
border = #0E4856
border_active = #2AA198
text = #93A1A1
text_muted = #657B83
tape = #073642

[nodes]
surface_card = #002B36
border_card = #0E4856
watcher = #859900
condition = #B58900
alert = #DC322F
screener = #268BD2
action = #6C71C4
note_default = #073642
text_default = #93A1A1

[edges]
default = #586E75
active = #2AA198
selected = #B58900
`;

export const BUILTIN_THEMES: ScriffleTheme[] = [
  { ...parseScriffleTheme(BLOOMBERG_THEME_RAW, 'bloomberg-terminal'), isBuiltin: true },
  { ...parseScriffleTheme(NORD_THEME_RAW, 'nord-frost'), isBuiltin: true },
  { ...parseScriffleTheme(GRUVBOX_THEME_RAW, 'gruvbox-dark'), isBuiltin: true },
  { ...parseScriffleTheme(TOKYO_NIGHT_THEME_RAW, 'tokyo-night'), isBuiltin: true },
  { ...parseScriffleTheme(SOLARIZED_DARK_THEME_RAW, 'solarized-dark'), isBuiltin: true },
];
