got it. here’s a clean **LLM-ready spec dump** you can paste into another model for vibecoding. no fluff, just system + rules + architecture.

---

# 📦 PROJECT SPEC: “Scriffle” (Automation + Event Graph System)

## 🧠 PRODUCT SUMMARY

Build a web app called **Scriffle**.

It is a **visual workflow automation system** where users create a canvas of nodes (like Figma Jam + n8n hybrid). The system continuously monitors financial market data from Sectors API and updates the canvas automatically through events.

The core idea:

> Users define watchers and rules visually.
> The backend runs continuously and updates notes, triggers alerts, and even creates new nodes automatically without user interaction.

---

# ⚙️ CORE ARCHITECTURE

## Event-driven system

```txt
WATCHERS → EVENTS → GRAPH ENGINE → NODE EXECUTION → CANVAS UPDATE
```

---

## SYSTEM COMPONENTS

### 1. Frontend (Canvas UI)

* Vanilla JS or React
* Canvas-based node editor (Figma Jam style or simple DOM nodes acceptable)
* Users can:

  * create nodes
  * connect nodes (edges)
  * edit node config
  * view live updates

Nodes appear as draggable cards.

---

### 2. Backend (Node.js / Express or Next.js API routes)

Responsibilities:

* store canvas state (nodes + edges)
* run watcher scheduler (cron)
* fetch Sectors API data
* execute graph engine
* persist events and logs

---

### 3. Scheduler (Watcher Engine)

* runs every 5–15 minutes (node-cron)
* fetches data from Sectors API
* evaluates all watcher nodes
* emits events when conditions match

---

### 4. Graph Engine

Processes events through connected nodes:

Flow:

```txt
Event → Condition Node → Action Node → Output Node (note/alert)
```

---

# 🧩 NODE SYSTEM (CRITICAL)

Only 5 node types allowed:

---

## 1. Watcher Node

Polls Sectors API.

```json
{
  "type": "watcher",
  "config": {
    "symbol": "BBCA",
    "metric": "price | volume | rank",
    "interval": 300
  }
}
```

Output:

```json
{
  "type": "EVENT",
  "symbol": "BBCA",
  "metric": "price_change",
  "value": 6.2
}
```

---

## 2. Condition Node

Evaluates event using DSL rule.

```json
{
  "type": "condition",
  "config": {
    "rule": "price_change > 5"
  }
}
```

---

## 3. Note Node

Stores and updates text.

```json
{
  "type": "note",
  "config": {
    "content": "BBCA looks interesting"
  }
}
```

---

## 4. Alert Node

Triggers UI notification or optional external alert.

```json
{
  "type": "alert",
  "config": {
    "channel": "ui | telegram"
  }
}
```

---

## 5. Action Node

Can mutate system.

Allowed actions:

* create_note
* create_watcher
* export_canvas

```json
{
  "type": "action",
  "config": {
    "action": "create_note"
  }
}
```

---

# 🧠 CONDITION DSL (IMPORTANT)

Users define rules using a simple expression language.

## Format:

```txt
metric operator value
```

## Examples:

```txt
price_change > 5
volume > 2 * avg_volume
rank_change <= -3
```

## Compound rules:

```txt
price_change > 5 AND volume > 2 * avg_volume
```

## Supported operators:

* `>`
* `<`
* `>=`
* `<=`
* `==`
* `!=`
* `AND`
* `OR`

---

## Evaluation rules:

* DSL is evaluated against event object
* No raw JS execution allowed
* Backend parses and evaluates safely

---

# 🔁 EXECUTION FLOW

## Cron cycle:

```txt
1. Scheduler runs (every 5–15 min)
2. Fetch Sectors API data
3. Compare with previous snapshot
4. Generate events
5. Send events into graph engine
6. Graph evaluates connected nodes
7. Trigger actions
8. Update database
```

---

## Event processing:

```txt
EVENT → connected nodes → condition check → pass → action execution
```

---

# 🗄️ DATABASE MODEL

## Canvas

* id
* name

## Nodes

```json
{
  "id": "",
  "type": "",
  "config": {},
  "position": {}
}
```

## Edges

```json
{
  "from": "node_id",
  "to": "node_id"
}
```

## Watchers

```json
{
  "node_id": "",
  "symbol": "",
  "last_checked_at": ""
}
```

## Logs

```json
{
  "event": "",
  "triggered_nodes": [],
  "timestamp": ""
}
```

---

# 🔥 KEY BEHAVIOR REQUIREMENTS

## Self-updating system

* Actions can create:

  * new notes
  * new watchers
* System evolves over time

---

## No manual execution requirement

* Everything runs automatically via scheduler

---

## Deterministic behavior

* Same input event → same graph output

---

## Canvas is just a view layer

* Backend is source of truth

---

# 🌐 EXTERNAL DATA SOURCE

Use:

* Sectors API (financial data)
* Poll via REST endpoints only (no websocket assumption)

---

# 🚫 CONSTRAINTS

* No Redis required
* No Kafka required
* No WebSockets required for MVP
* No heavy microservices
* No AI agent loops required
* Keep node system limited to 5 types only

---

# 🎯 MVP GOAL

A working system where:

1. User builds a canvas with watcher nodes
2. System runs on schedule
3. Market data triggers events
4. Events flow through graph
5. Notes and alerts update automatically
6. Canvas reflects changes without manual input

---

# 🧪 DEMO SCENARIO

* User creates watcher: “BBCA price”
* Condition: price_change > 5%
* System runs every 5 minutes
* Event triggers condition
* Note updates automatically:

  > “BBCA surged +6.2% at 13:30”
* Log entry created
* Alert fired in UI

---

# 🧠 CORE IDEA SUMMARY

> “A self-updating financial research canvas powered by event-driven automation nodes.”

---

if you want, i can next give you:

* a **minimal repo structure (folders + files)**
* or a **super tight v1 implementation checklist (what to code first, second, third)**

