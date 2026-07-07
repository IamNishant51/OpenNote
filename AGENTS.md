# AGENTS.md — OpenNotes Project Governance

## Project Identity
- **Name**: OpenNotes — feature-complete Notion clone
- **Stack**: Tauri 2.0 + React 19 + TypeScript + TailwindCSS 4 + rusqlite + BlockNote + Vercel AI SDK v7
- **Design**: Must match DESIGN-notion.md exactly (colors, typography, spacing, rounded)

## Build Status — All Complete

### Phase 1 — Core (done)
Tauri 2.0 shell, SQLite (workspaces, pages, document_states), BlockNote editor, sidebar (page tree, favorites, trash), page props (icon, cover, font, width), dark mode, Quick Find (Cmd+K)

### Phase 2 — Import/Export (done)
Markdown (BlockNote native), CSV (PapaParse → table blocks), HTML (BlockNote native), ImportDialog, ExportDialog, sidebar buttons

### Phase 3 — AI Engine (done)
7 providers (OpenAI, Anthropic, Google, Mistral, DeepSeek, Ollama, LM Studio), local model discovery (Ollama/LM Studio probes), API key management, 13 AI actions (Write, Continue, Summarize, Translate, Explain, Improve, Fix Spelling, Change Tone, Simplify, Expand, Shorten, Brainstorm, Find Action Items), AI Panel with Actions tab + Chat Agent tab (streaming), AI Settings dialog

### Phase 4 — Databases (done)
Full DB schema in Rust (databases, properties, items, item_properties, views), 14 Tauri commands, 7 views (Table, Board, Calendar, Gallery, Timeline, List, Chart), 20 property types (text, number, select, multi-select, status, date, checkbox, URL, email, phone, formula, relation, rollup, button, rating, progress, created-time, last-edited-time, ai-summary), property cell editors, filters/sorts toolbar, "New database" in sidebar

### Phase 5 — Advanced Blocks (not started)
Columns, synced blocks, TOC, breadcrumbs, backlinks, comments, version history, templates

### Phase 6 — Collaboration (not started)
Yjs WebSocket sync, multi-cursor, permissions, sharing, notifications

### Phase 7 — Polish (not started)
Chart view (done in Phase 4), automations, custom AI agents, AI search RAG, performance, mobile

## The 5 Rules
1. Build in stated phase order — no skipping
2. DESIGN-notion.md is law — every color, spacing, size must match
3. No fabrication — fail honestly with error states, never fake results
4. Verify before marking done — test every component with real data
5. Don't touch what's verified — refactor only when required
