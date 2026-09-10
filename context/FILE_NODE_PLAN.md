# Implementation Plan: Universal File Node & Media Attachment System

## 1. Overview & Vision
Introduce a **Universal File Node** (`'file'`) to Scriffle's whiteboard canvas that acts as an interactive file card/attachment.
- **Universal Format Support**: Works with PDFs, Docs, PPT slides, Spreadsheets, Music/Audio (`.mp3`, `.wav`), Code/JSON/CSV, and `.scriffle` files.
- **Dynamic File Type Icons & Badges**: Automatically displays file-type specific icons and aesthetic color capsules based on extension/category (PDF, Presentation, Audio, Spreadsheet, Document, Code, Archive).
- **Direct In-Browser Actions**: Features an immediate **"Open in New Tab"** / **"Download"** button directly on the card so users can inspect or play media instantly.
- **Automation Integration**: Action nodes (like Fundamental Report generation or Data Exporters) can programmatically spawn File Nodes attached to research sticky notes. Users can also manually drop/create File Nodes from the Top Nav.

---

## 2. Supported File Categories & Dynamic Visuals

| Category | Typical Extensions | Dynamic Icon | Theme Badge Color (Light / Mono / Dark) |
| :--- | :--- | :--- | :--- |
| **PDF** | `.pdf` | `file_pdf_2_line` / `file_text_line` | Crimson / Stone / Dark Red (`#DC2626`) |
| **Presentation / Slide** | `.ppt`, `.pptx`, `.key` | `presentation_line` / `slideshow_line` | Amber / Stone / Dark Orange (`#D97706`) |
| **Document** | `.doc`, `.docx`, `.txt`, `.md` | `file_word_2_line` / `file_text_line` | Royal Blue / Stone / Dark Slate (`#2563EB`) |
| **Spreadsheet** | `.xls`, `.xlsx`, `.csv` | `table_line` / `file_spreadsheet_line` | Emerald / Stone / Dark Green (`#059669`) |
| **Audio / Music** | `.mp3`, `.wav`, `.m4a`, `.ogg` | `music_2_line` / `volume_line` | Violet / Stone / Dark Purple (`#7C3AED`) |
| **Code / Data** | `.json`, `.ts`, `.py`, `.scriffle` | `code_line` / `file_code_line` | Indigo / Stone / Slate (`#4F46E5`) |
| **Generic / Archive** | `.zip`, `.tar`, `.rar`, other | `attachment_line` / `folder_download_line` | Slate / Stone / Muted Slate (`#64748B`) |

---

## 3. Data Schema & Types (`src/types/canvas.ts`)

```typescript
export type FileCategory = 'pdf' | 'presentation' | 'document' | 'spreadsheet' | 'audio' | 'code' | 'archive' | 'generic';

export interface FileConfig {
  fileName: string;         // e.g. "BBCA_Fundamental_Report.pdf", "earnings_call_q2.mp3"
  fileUrl: string;          // e.g. "/exports/BBCA_report.pdf" or "https://..."
  fileSize?: string;        // e.g. "2.4 MB"
  fileCategory?: FileCategory;
  extension?: string;       // e.g. "pdf", "pptx", "mp3"
  caption?: string;         // Optional descriptive note
  createdAt?: string;
}
```

---

## 4. Components to Build & Modify

### A. `FileNode.tsx` (`src/components/canvas/nodes/FileNode.tsx`)
- **Card Design**:
  - FigJam sticker aesthetics with 2px crisp border, zero shadows, rounded-2xl corners.
  - Left icon badge showing the dynamic icon and extension tag (e.g. `PDF`, `PPTX`, `MP3`).
  - Filename display (truncated cleanly with tooltip), file size, and timestamp.
  - Interactive **Open in New Tab** button (`target="_blank"` with `rel="noopener noreferrer"`) and **Download** trigger.
  - Interactive **Open File Location** button (`folder_open_line`) triggering native OS file explorer / finder.
  - Input & Output connection handles (allows linking to Watchers, Notes, and Condition nodes).
- **Themes**:
  - Fully reactive across **Light (FigJam colorful)**, **Warm Mono (stone/paper)**, and **Dark (soft matte charcoal)**.

### B. Cross-Platform Open Location API (`/api/file/open-location`)
- Multi-OS support:
  - **macOS (`darwin`)**: Executes `open -R "<path>"` (highlights in Finder) or `open "<dir>"`.
  - **Windows (`win32`)**: Executes `explorer.exe /select,"<path>"` (highlights in File Explorer).
  - **Linux (`linux`)**: Executes `xdg-open "<dir>"` to open default file manager (Nautilus, Dolphin, Thunar).

### C. `EditNodeModal.tsx`
- Add form fields for `'file'` node:
  - File Name
  - File URL / Path
  - Local Disk Path (for Open File Location)
  - File Category / Extension Selector (with auto-detection from filename)
  - Optional File Size & Caption

### D. `TopNav.tsx` & Toolbars
- Add **"File Attachment"** button under the canvas insertion menu / node creation toolset.

### E. Action Node & Graph Engine Integration (`graphEngine.ts`)
- Allows Action Nodes to spawn linked File Nodes (e.g. Fundamental Report PDF or exported JSON dataset) next to research notes.

---

## 5. Verification & Testing Checklist
- [ ] Add manual File Node for a PDF, MP3 audio, PPT slide, and CSV spreadsheet.
- [ ] Verify icons and category badges match the file extension.
- [ ] Verify clicking **"Open in New Tab"** opens the file URL in a new browser tab.
- [ ] Verify node editing, repositioning, and undo/redo (`Ctrl+Z` / `Ctrl+Shift+Z`) work smoothly.
- [ ] Verify styling across Light, Mono, and Dark themes.
