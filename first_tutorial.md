# 📋 Scriffle Interactive Walkthrough: Step-by-Step Tutorial

Follow these exact steps in order to experience all features of the Scriffle MVP.

---

### Step 1: Start the server and open the canvas
1. In your terminal, run:
   ```bash
   bun dev
   ```
2. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
3. You will see an infinite whiteboard with 5 pre-connected cards (`Watcher`, `Condition`, `Sticky Note`, `Alert`, and `Action`).

---

### Step 2: Trigger a live market surge
1. Look at the bottom toolbar (**Demo Controls**).
2. Click the button: **`Simulate BBCA Surge (+6.37%)`**.
3. **Observe what happens automatically:**
   * The **Watcher: BBCA** card cycle counter changes to `13 runs`.
   * The **Condition** badge turns **Passed**.
   * The **Sticky Note** text updates instantly to: `🚀 BBCA surged +6.37% to Rp 10850...`.
   * A new live entry appears in the right **Activity Feed**.
   * The **Action** card automatically spawns a **new child Sticky Note** on the right!

---

### Step 3: Type directly on a Sticky Note
1. Click directly inside the yellow **Sticky Note** text.
2. Backspace the text and type:
   > `Banking sector breakout confirmed. Target resistance: Rp 11.200.`
3. Click anywhere outside the note. (Notice: No popup was opened, and your changes saved immediately).
4. Hover your mouse over the note header and click the **Mint** or **Pink** dot to switch its color.

---

### Step 4: Add elements using Right-Click
1. **Right-click** on any empty space on the canvas.
2. Select **`Sticker: Breakout`**. (A purple Breakout sticker appears at your mouse position).
3. Drag the sticker near your sticky note.
4. **Right-click** on empty space again, then **left-click** anywhere on the canvas to cancel and close the menu.

---

### Step 5: Wire cards together freely
1. Hover your mouse over your newly placed **Breakout Sticker** or **Sticky Note**.
2. Notice the connection dots appear on all 4 sides (Top, Bottom, Left, Right).
3. Click and drag a line from the right dot to another card to link them together.

---

### Step 6: Paste and resize an image
1. Take a quick screenshot on your computer (or copy any image to your clipboard with `Ctrl+C` / `Cmd+C`).
2. Click on the canvas and press **`Ctrl+V`** (or **`Cmd+V`** on Mac).
3. The image appears directly under your cursor.
4. Click the image to select it.
5. Drag any corner handle to resize the image.

---

### Step 7: Double-click to customize a Watcher
1. **Double-click** on the **Watcher** card (the one showing `BBCA`).
2. In the modal that opens:
   * Change **Stock Ticker Symbol** to `BMRI`.
   * Change **Polling Interval** to `120`.
3. Click **`Save Changes`**.
4. The card now tracks `BMRI`.

---

### Step 8: Reset to a clean board (Optional)
When you want to reset everything back to the initial demo state, run:
```bash
bun run prisma/seed.ts
```
Then refresh your browser tab.
