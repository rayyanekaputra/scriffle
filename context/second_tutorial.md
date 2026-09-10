# 🛠️ Scriffle Creator Walkthrough: Building a Custom Automation Flow from Scratch

Follow this step-by-step tutorial to build your own **custom financial research automation** from a blank canvas.

---

### Step 1: Open Scriffle
1. Start the server if it's not running:
   ```bash
   bun dev
   ```
2. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
3. Pan or zoom out to an empty area of the canvas.

---

### Step 2: Add a Market Watcher for Telkom (`TLKM`)
1. Click the **`Watcher`** button in the top toolbar (or **right-click** on empty canvas $\rightarrow$ **Market watcher**).
2. A new Watcher card appears on the canvas. Drag it to the left side of your work area.
3. **Double-click** the Watcher card to configure it:
   * **Stock Ticker Symbol:** Type `TLKM`
   * **Polling Interval:** Type `300`
4. Click **`Save Changes`**.

---

### Step 3: Add a Condition Rule for High Volume
1. Click the **`Condition`** button in the top toolbar (or **right-click** $\rightarrow$ **Condition rule**).
2. Drag the Condition card to the right of your `TLKM` Watcher card.
3. **Double-click** the Condition card to set your custom rule:
   * **Condition Rule (DSL):** Type:
     ```text
     volume > 10000000 AND price_change > 2
     ```
4. Click **`Save Changes`**.

---

### Step 4: Add a Sticky Note directly on the Canvas
1. Click the **`Sticky Note`** button in the top toolbar (or **right-click** $\rightarrow$ **Sticky note**).
2. Drag the sticky note to the right of your Condition card.
3. Hover over the sticky note header and click the **Blue** dot to make it blue.
4. **Click directly inside the sticky note** (no popup needed!) and type your template or thesis:
   ```text
   📈 TLKM Volume Surge: ${symbol} is up +${price_change}% with volume ${volume} at ${timestamp}.
   ```
5. Click anywhere outside the note to save.

---

### Step 5: Add an Alert Notification Card
1. Click the **`Alert`** button in the top toolbar.
2. Drag the Alert card below your Sticky Note.
3. **Double-click** the Alert card:
   * **Alert Channel:** Select `UI Toast Notification`
4. Click **`Save Changes`**.

---

### Step 6: Connect the entire flow
1. Hover your mouse over the **Watcher (`TLKM`)** card.
2. Click and drag from its **right connection handle** to the **left handle** of the **Condition** card.
3. Click and drag from the **Condition's right handle** to the **left handle of your Sticky Note**.
4. Click and drag another line from the **Condition's right handle** to the **left handle of your Alert card**.

---

### Step 7: Add Freeform Annotations & Badges
1. **Add a Section Title:** Click **`Text`** in the top toolbar, click inside the text box, and type:
   > `Telkom Indonesia (TLKM) Momentum Strategy`
2. **Add a Sticker:** Right-click above your flow $\rightarrow$ click **`Sticker: Bullish`**.
3. Drag the sticker next to your title.

---

### Step 8: Test your custom flow!
1. Look at the bottom **Demo Controls** bar.
2. Click **`Poll Market Data`** (or **`Simulate BBCA Surge`**) to inject market ticks.
3. Watch the signal travel through your custom `TLKM` flow, update your note, and log to the Activity Feed!
