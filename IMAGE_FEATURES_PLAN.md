# 📋 Implementation Plan: Canvas Image Studio (Upload, Clipboard Paste, Transparency, Resizing)

## 1. Feature Goals & Specifications

Empower users to treat the Scriffle whiteboard like a real canvas by adding full image manipulation capabilities:
1. **Upload Pictures:** File upload button in the top toolbar + right-click context menu file picker.
2. **Copy & Paste Pictures (`Ctrl+V` / `Cmd+V`):** Listen to global paste events; extract image data directly from the OS clipboard and place it as an image node at the current mouse cursor or viewport center.
3. **Preserve PNG Transparency:** Ensure transparent PNGs render with **zero background fill**, transparent canvas container, and optional toggleable border so cutouts and stickers look clean and native.
4. **Interactive On-Canvas Resizing:** Integrate `@xyflow/react`'s native `<NodeResizer />` or custom bounding box handles directly on selected `ImageNode` cards so users can resize freely with aspect-ratio locking.

---

## 2. Phase-by-Phase Execution Order

```
Phase 1: Image Storage API & Node Data Schema Updates
   ▼
Phase 2: Resizable Image Node Component (`ImageNode.tsx` with `<NodeResizer />`)
   ▼
Phase 3: File Upload Picker & Clipboard Paste Listener (`Ctrl+V` / `Cmd+V`)
   ▼
Phase 4: TopNav & ContextMenu Integration
   ▼
Phase 5: Verification & End-to-End Build Test
```

---

### 📦 Phase 1: Image Schema & Backend Storage
**Goal:** Support storing dimensions (`width`, `height`), opacity, and transparent styling in image configs.

1. **Update `ImageConfig` in [`src/types/canvas.ts`](file:///home/abzolute/Projects/hackathon/src/types/canvas.ts):**
   ```typescript
   export interface ImageConfig {
     url: string;
     caption?: string;
     width?: number;        // e.g. 280
     height?: number;       // e.g. 200
     isTransparent?: boolean;
     aspectRatio?: number;
   }
   ```
2. **Image Upload API Route (`src/app/api/upload/route.ts`):**
   * Accepts `multipart/form-data` or base64 payloads.
   * Saves uploaded images to `public/uploads/` or converts them to compact data URLs for instant local persistence.

---

### 🖼️ Phase 2: Resizable Transparent Image Node
**Goal:** Build a smooth, interactive resizable image component with full transparency support.

1. **Implement `NodeResizer` in [`src/components/canvas/nodes/ImageNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/ImageNode.tsx):**
   * Use `@xyflow/react`'s `NodeResizer` component.
   * Features:
     * Corner & edge resize handles visible when the node is **selected**.
     * `keepAspectRatio: true` option to prevent image distortion.
     * On resize end $\rightarrow$ Debounce and persist new `width` & `height` to `/api/canvas/nodes/[id]`.
2. **Transparent PNG Rendering:**
   * Remove opaque white background wrappers (`bg-white`).
   * For transparent PNGs: render clean transparent container with a subtle dashed selection outline when clicked, and zero background or tape when unselected.

---

### 📋 Phase 3: Global Clipboard Paste & Drag-and-Drop
**Goal:** Allow users to copy any image from the web or screenshot tool and paste it directly onto the whiteboard with `Cmd+V` / `Ctrl+V`.

1. **Clipboard Paste Listener in [`src/components/canvas/MarketCanvas.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/MarketCanvas.tsx):**
   * Listen to window `paste` event.
   * Intercept clipboard items matching `item.type.indexOf('image') !== -1`.
   * Convert file to base64 Data URL or upload via `/api/upload`.
   * Determine drop position (current mouse coordinates or viewport center via `screenToFlowPosition`).
   * Spawn new `image` node immediately on the canvas.
2. **Enhance Drag-and-Drop:**
   * Automatically detect natural image width/height on drop and set default dimensions.

---

### 🎛️ Phase 4: Toolbar & Context Menu Integration
**Goal:** Provide one-click image upload buttons in the UI.

1. **TopNav Button (`src/components/controls/TopNav.tsx`):**
   * Add **"Upload Image"** button with hidden `<input type="file" accept="image/*" />`.
2. **Context Menu Option (`src/components/canvas/ContextMenu.tsx`):**
   * Add **"Upload Picture"** option in the right-click menu.

---

### 🧪 Phase 5: Verification Checklist & Demo Flow

- [ ] **Clipboard Paste Test:** Take a screenshot or copy an image from the web, press `Cmd+V` / `Ctrl+V` on canvas $\rightarrow$ Verify image appears at cursor position.
- [ ] **Upload Test:** Click "Upload Image" in toolbar $\rightarrow$ Select file $\rightarrow$ Verify image renders on canvas.
- [ ] **Transparency Test:** Upload a transparent PNG $\rightarrow$ Verify zero white bounding box or artifacts around the transparent cutout.
- [ ] **Resize Test:** Click on the image node $\rightarrow$ Drag corner handles $\rightarrow$ Verify smooth resizing and persistence across page refreshes.
- [ ] **Build Check:** Run `bun run build` to confirm zero type errors.

---

## 3. Deliverables Checklist

- [ ] `src/types/canvas.ts`: Extended `ImageConfig` with `width`, `height`, `isTransparent`.
- [ ] `src/components/canvas/nodes/ImageNode.tsx`: Interactive resizable image card with `NodeResizer` and transparency.
- [ ] `src/components/canvas/MarketCanvas.tsx`: Global `paste` event handler + image drop improvements.
- [ ] `src/components/controls/TopNav.tsx` & `ContextMenu.tsx`: File upload buttons.
