#!/usr/bin/env bash

# ==============================================================================
#  Scriffle — Interactive Setup & Onboarding Script (macOS / Linux)
# ==============================================================================

set -e

# Terminal Colors & Formatting
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"
BLUE="\033[38;5;33m"
CYAN="\033[38;5;39m"
GREEN="\033[38;5;42m"
YELLOW="\033[38;5;220m"
RED="\033[38;5;196m"
GRAY="\033[38;5;244m"

print_banner() {
  clear 2>/dev/null || true
  echo -e "${BLUE}${BOLD}"
  echo "███████╗ ██████╗██████╗ ██╗███████╗███████╗██╗     ███████╗"
  echo "██╔════╝██╔════╝██╔══██╗██║██╔════╝██╔════╝██║     ██╔════╝"
  echo "███████╗██║     ██████╔╝██║█████╗  █████╗  ██║     █████╗  "
  echo "╚════██║██║     ██╔══██╗██║██╔══╝  ██╔══╝  ██║     ██╔══╝  "
  echo "███████║╚██████╗██║  ██║██║██║     ██║     ███████╗███████╗"
  echo "╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝     ╚══════╝╚══════╝"
  echo -e "${RESET}"
  echo -e "  ${BOLD}Visual Market Automation & Research Whiteboard${RESET}"
  echo -e "  ${DIM}─────────────────────────────────────────────────────────${RESET}"
}

# ------------------------------------------------------------------------------
# Re-Run Detection: Check if Scriffle is already set up
# ------------------------------------------------------------------------------
check_already_setup() {
  if [ -d "node_modules" ] && [ -f "prisma/dev.db" ]; then
    print_banner
    echo -e "  ${GREEN}${BOLD}✓ Scriffle is already set up on this machine!${RESET}"
    echo -e "  ${DIM}─────────────────────────────────────────────────────────${RESET}\n"
    echo -e "  To start Scriffle, type one of these commands in your terminal:\n"
    
    if command -v bun &>/dev/null; then
      echo -e "    ${CYAN}${BOLD}bun run dev${RESET}       ${DIM}← Start development server (fast reload)${RESET}"
      echo -e "    ${CYAN}${BOLD}bun run start${RESET}     ${DIM}← Start production server (after bun run build)${RESET}"
    else
      echo -e "    ${CYAN}${BOLD}npm run dev${RESET}       ${DIM}← Start development server${RESET}"
      echo -e "    ${CYAN}${BOLD}npm run start${RESET}     ${DIM}← Start production server (after npm run build)${RESET}"
    fi

    echo -e "\n  Then open your browser at:  ${BLUE}${BOLD}http://localhost:3000${RESET}\n"
    echo -e "  ${DIM}─────────────────────────────────────────────────────────${RESET}"
    echo -e "  ${GRAY}💡 Tip: If you want to reset everything or start fresh,${RESET}"
    echo -e "  ${GRAY}   delete the 'prisma/dev.db' file and run this setup script again.${RESET}\n"

    read -rp "  Would you like to launch Scriffle right now? [Y/n]: " LAUNCH_NOW
    LAUNCH_NOW=${LAUNCH_NOW:-Y}
    if [[ "$LAUNCH_NOW" =~ ^[Yy]$ ]]; then
      echo -e "\n  ${BLUE}🚀 Starting Scriffle...${RESET}\n"
      if command -v bun &>/dev/null; then
        exec bun run dev
      else
        exec npm run dev
      fi
    else
      echo -e "\n  ${DIM}Have fun building on Scriffle! 👋${RESET}\n"
      exit 0
    fi
  fi
}

check_already_setup

print_banner
echo -e "  ${BOLD}Welcome! Let's get Scriffle set up on your machine.${RESET}"
echo -e "  ${DIM}This will take less than a minute.${RESET}\n"

# ------------------------------------------------------------------------------
# Step 1: Runtime Detection & Choice
# ------------------------------------------------------------------------------
echo -e "  ${CYAN}${BOLD}Step 1: Choose your runtime${RESET}"
echo -e "  ${DIM}A runtime is the engine that powers Scriffle on your computer.${RESET}\n"

HAS_BUN=false
HAS_NODE=false

if command -v bun &>/dev/null; then
  HAS_BUN=true
  BUN_VER=$(bun --version)
fi

if command -v node &>/dev/null; then
  HAS_NODE=true
  NODE_VER=$(node --version)
fi

if [ "$HAS_BUN" = true ]; then
  echo -e "     ${BOLD}[1]${RESET}  ${GREEN}⚡ Bun${RESET} ${DIM}(v${BUN_VER})${RESET} — ${BOLD}Recommended${RESET}. Ultra-fast native engine. ${GREEN}✓ Installed${RESET}"
else
  echo -e "     ${BOLD}[1]${RESET}  ${YELLOW}⚡ Bun${RESET} — ${BOLD}Recommended${RESET}. Ultra-fast native engine. ${DIM}(Will auto-install)${RESET}"
fi

if [ "$HAS_NODE" = true ]; then
  echo -e "     ${BOLD}[2]${RESET}  ${BLUE}🟢 Node.js${RESET} ${DIM}(${NODE_VER})${RESET} — Universal JavaScript runtime. ${GREEN}✓ Installed${RESET}"
else
  echo -e "     ${BOLD}[2]${RESET}  ${GRAY}🟢 Node.js${RESET} — Universal JavaScript runtime. ${DIM}(Not found)${RESET}"
fi

echo ""
read -rp "  Enter 1 or 2 (default: 1 — press Enter): " RUNTIME_CHOICE
RUNTIME_CHOICE=${RUNTIME_CHOICE:-1}

SELECTED_RUNTIME="bun"

if [ "$RUNTIME_CHOICE" = "2" ]; then
  if [ "$HAS_NODE" = false ]; then
    echo -e "\n  ${RED}❌ Node.js is not installed on your system.${RESET}"
    echo -e "  Please download it from ${BLUE}https://nodejs.org${RESET} or choose Bun.\n"
    exit 1
  fi
  SELECTED_RUNTIME="node"
else
  if [ "$HAS_BUN" = false ]; then
    echo -e "\n  ${YELLOW}⚡ Installing Bun automatically for you...${RESET}"
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if ! command -v bun &>/dev/null; then
      echo -e "\n  ${RED}❌ Could not automatically configure Bun in PATH.${RESET}"
      echo -e "  Please run ${CYAN}export PATH=\"\$HOME/.bun/bin:\$PATH\"${RESET} and rerun setup."
      exit 1
    fi
    echo -e "  ${GREEN}✓ Bun installed successfully!${RESET}"
  fi
  SELECTED_RUNTIME="bun"
fi

echo -e "\n  ${GREEN}✓ Using ${BOLD}${SELECTED_RUNTIME}${RESET}\n"

# ------------------------------------------------------------------------------
# Step 2: Choose Starting Canvas Workspace
# ------------------------------------------------------------------------------
echo -e "  ${CYAN}${BOLD}Step 2: Choose your starting canvas${RESET}"
echo -e "  ${DIM}How would you like Scriffle to look when it first opens?${RESET}\n"

echo -e "     ${BOLD}[1]${RESET}  ${YELLOW}🌟 Full Demo Workspace${RESET}  — Pre-built IDX momentum flow with live"
echo -e "                                    watchers, condition rules, and sticky notes."
echo -e "                                    ${DIM}Great for exploring Scriffle immediately.${RESET}"
echo -e "     ${BOLD}[2]${RESET}  ${BLUE}🚀 Clean Canvas${RESET}         — Starts completely blank with an interactive"
echo -e "                                    guided tour and sandbox tutorial missions."
echo -e "                                    ${DIM}Best for building your own research board.${RESET}\n"

read -rp "  Enter 1 or 2 (default: 1 — press Enter): " CANVAS_CHOICE
CANVAS_CHOICE=${CANVAS_CHOICE:-1}

echo ""

# ------------------------------------------------------------------------------
# Step 3: Automated Installation & Database Initialization
# ------------------------------------------------------------------------------
echo -e "  ${CYAN}${BOLD}Step 3: Setting up Scriffle...${RESET}\n"

# 1. Install dependencies
echo -en "  ${BLUE}📦  Installing dependencies...${RESET}"
if [ "$SELECTED_RUNTIME" = "bun" ]; then
  bun install --silent > /dev/null 2>&1 || bun install
else
  npm install --silent > /dev/null 2>&1 || npm install
fi
echo -e "\r  ${GREEN}✓  Dependencies installed.          ${RESET}"

# 2. Prisma Generate
echo -en "  ${BLUE}⚙️   Generating database client...${RESET}"
if [ "$SELECTED_RUNTIME" = "bun" ]; then
  bunx prisma generate > /dev/null 2>&1
else
  npx prisma generate > /dev/null 2>&1
fi
echo -e "\r  ${GREEN}✓  Database client generated.       ${RESET}"

# 3. Prisma DB Push (create SQLite database)
echo -en "  ${BLUE}🗄️   Configuring SQLite database...${RESET}"
if [ "$SELECTED_RUNTIME" = "bun" ]; then
  bunx prisma db push --skip-generate > /dev/null 2>&1
else
  npx prisma db push --skip-generate > /dev/null 2>&1
fi
echo -e "\r  ${GREEN}✓  SQLite database configured.      ${RESET}"

# 4. Seed or Fresh Board
if [ "$CANVAS_CHOICE" = "2" ]; then
  echo -en "  ${BLUE}🚀  Initializing fresh clean canvas...${RESET}"
  if [ "$SELECTED_RUNTIME" = "bun" ]; then
    bun run ./scripts/dev.ts --start-fresh --dry-run > /dev/null 2>&1 || true
  fi
  echo -e "\r  ${GREEN}✓  Clean canvas initialized.        ${RESET}"
else
  echo -en "  ${BLUE}🌱  Seeding demo workspace...${RESET}"
  if [ "$SELECTED_RUNTIME" = "bun" ]; then
    bun run prisma/seed.ts > /dev/null 2>&1
  else
    npx tsx prisma/seed.ts > /dev/null 2>&1 || node -r esbuild-register prisma/seed.ts > /dev/null 2>&1 || true
  fi
  echo -e "\r  ${GREEN}✓  Demo workspace seeded.           ${RESET}"
fi

echo -e "\n  ${DIM}─────────────────────────────────────────────────────────${RESET}"
echo -e "  ${GREEN}${BOLD}🎉 Scriffle setup complete!${RESET}"
echo -e "  ${DIM}─────────────────────────────────────────────────────────${RESET}\n"

echo -e "  📌 ${BOLD}To start Scriffle again later, simply run:${RESET}"
if [ "$SELECTED_RUNTIME" = "bun" ]; then
  echo -e "       ${CYAN}${BOLD}bun run dev${RESET}     ${DIM}← Start development server${RESET}"
  echo -e "       ${CYAN}${BOLD}bun run start${RESET}   ${DIM}← Start production server (after bun run build)${RESET}"
else
  echo -e "       ${CYAN}${BOLD}npm run dev${RESET}     ${DIM}← Start development server${RESET}"
  echo -e "       ${CYAN}${BOLD}npm run start${RESET}   ${DIM}← Start production server (after npm run build)${RESET}"
fi
echo ""
echo -e "  🌐 URL: ${BLUE}${BOLD}http://localhost:3000${RESET}\n"

# ------------------------------------------------------------------------------
# Step 4: Prompt Launch
# ------------------------------------------------------------------------------
read -rp "  Would you like to start Scriffle right now? [Y/n]: " LAUNCH_CONFIRM
LAUNCH_CONFIRM=${LAUNCH_CONFIRM:-Y}

if [[ "$LAUNCH_CONFIRM" =~ ^[Yy]$ ]]; then
  echo -e "\n  ${BLUE}🚀 Launching Scriffle...${RESET}\n"
  if [ "$CANVAS_CHOICE" = "2" ]; then
    if [ "$SELECTED_RUNTIME" = "bun" ]; then
      exec bun run dev --start-fresh
    else
      exec npm run dev
    fi
  else
    if [ "$SELECTED_RUNTIME" = "bun" ]; then
      exec bun run dev
    else
      exec npm run dev
    fi
  fi
else
  echo -e "\n  ${DIM}All set! Run ${CYAN}bun run dev${RESET}${DIM} whenever you're ready. 👋${RESET}\n"
fi
