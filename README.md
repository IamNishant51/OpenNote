# OpenNotes

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Rusqlite-003B57?logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss&logoColor=white)

**OpenNotes** is a feature-complete, open-source Notion clone built with modern web technologies. Take notes, manage databases, use AI assistants, and collaborate with your team — all in one beautiful desktop app.

---

## ✨ Features

### 📝 Rich Note Editing
- **Block-based editor** powered by BlockNote with drag-and-drop support
- **Full formatting**: headings, paragraphs, lists, to-do items, code blocks, tables, and more
- **Page properties**: custom icons, covers, fonts, and page widths
- **Auto-save** with local document state persistence
- **Dark mode** with Notion-matching design tokens

### 🗄️ Databases (Like Notion Databases)
- **7 view types**: Table, Board, Calendar, Gallery, Timeline, List, and Chart
- **20 property types**: text, number, select, multi-select, status, date, checkbox, URL, email, phone, and more
- **Filters and sorts** with a visual toolbar
- **Add rows and columns** directly in the UI
- **Properties editor** with type-specific cell editors (rating stars, checkboxes, date pickers)

### 🤖 AI-Powered Writing
- **13 AI actions**: Write, Continue, Summarize, Translate, Explain, Improve, Fix Spelling, Change Tone, Simplify, Expand, Shorten, Brainstorm, Find Action Items
- **Streaming chat agent** with conversation history
- **7 AI providers**: OpenAI, Anthropic, Google, Mistral, DeepSeek, Ollama (local), LM Studio (local), and **NVIDIA NIM**
- **Custom AI agents** with personal system prompts
- **AI Search** powered by full-text search

### 🔍 Quick Find & Search
- **⌘K / Ctrl+K** quick navigation across all your pages
- **FTS5 full-text search** powered by SQLite

### 🤝 Collaboration
- **Yjs WebSocket sync** for real-time multi-user editing
- **Multi-cursor awareness** — see where collaborators are editing
- **Sharing & permissions**: view, comment, or edit access
- **Notifications** for shared pages
- **Threaded comments** on any block
- **Version history** with snapshots

### 📥 Import & Export
- **Import**: Markdown (.md), CSV (.csv), HTML (.html)
- **Export**: Markdown, CSV, HTML
- **CSV → Table blocks** conversion for databases

### 🏗️ Advanced
- **Page tree** with hierarchical pages and breadcrumbs
- **Favorites & trash** for organizing pages
- **Templates** with pre-built content
- **Backlinks** — see which pages link to the current page
- **Table of Contents** panel

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Desktop Framework** | [Tauri 2.0](https://tauri.app/) |
| **Frontend** | React 19 + TypeScript |
| **Styling** | TailwindCSS 4 with Notion-exact design tokens |
| **Editor** | [BlockNote](https://blocknotejs.org/) 0.51.4 |
| **State Management** | Zustand 5 |
| **Database** | SQLite via Rusqlite with WAL mode and FTS5 |
| **AI** | [Vercel AI SDK v7](https://ai-sdk.dev/) |
| **Collaboration** | Yjs + y-websocket |
| **Build** | Vite 7 + pnpm |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9
- **Rust** >= 1.70 (for Tauri backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/IamNishant51/OpenNote.git
cd OpenNote

# Install dependencies
pnpm install
```

### Run the Desktop App

```bash
pnpm tauri dev
```

### Run in Browser (No Tauri)

```bash
pnpm dev
```

### Build for Production

```bash
pnpm tauri build
```

### Browser Mode (No Tauri Required)

OpenNotes also works as a standard web app. Just run:

```bash
pnpm dev
```

Then open `http://localhost:1420` in your browser. Data is stored in `localStorage`.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── editor/           # BlockNote editor, breadcrumbs
│   ├── sidebar/          # Page tree, favorites, trash
│   ├── database/         # Databases with 7 views
│   ├── ai/               # AI panel, settings, chat, agents
│   ├── shared/           # Comments, versions, TOC, backlinks
│   ├── collaboration/    # Sharing, notifications, cursors
│   ├── import-export/    # Import/export dialogs
│   └── search/           # Quick find
├── hooks/                # useTauriCommands, useDatabase, useYjsSync
├── lib/                  # AI providers, import/export logic
├── stores/               # Zustand stores (workspace, UI, AI, DB, collab)
├── types/                # TypeScript interfaces
└── styles/               # Design tokens and global styles

src-tauri/
├── src/
│   ├── lib.rs            # Tauri app setup
│   ├── db/mod.rs         # SQLite schema + CRUD (all tables)
│   └── commands/mod.rs   # 30+ Tauri commands
└── tauri.conf.json
```

---

## 🔌 Supported AI Providers

| Provider | Type | Models |
|----------|------|--------|
| **OpenAI** | API | GPT-4o, GPT-4o Mini, o3-mini |
| **Anthropic** | API | Claude Sonnet 4, Claude Haiku 3.5 |
| **Google** | API | Gemini 2.0 Flash, Gemini 2.0 Pro |
| **Mistral** | API | Mistral Large, Mistral Small |
| **DeepSeek** | API | DeepSeek Chat, DeepSeek Reasoner |
| **NVIDIA NIM** | API | Llama 3.3, DeepSeek R1, Qwen 2.5 |
| **Ollama** | Local | Auto-discovered from `localhost:11434` |
| **LM Studio** | Local | Auto-discovered from `localhost:1234` |

---

## 🗺️ Roadmap

### Phase 1 — Core ✅
- [x] Tauri 2.0 shell, SQLite database
- [x] BlockNote block editor with autosave
- [x] Sidebar with page tree, favorites, trash
- [x] Page properties (icon, cover, font, width)
- [x] Dark mode, Quick Find (⌘K)

### Phase 2 — Import/Export ✅
- [x] Markdown, CSV, HTML import/export
- [x] Import and export dialogs

### Phase 3 — AI Engine ✅
- [x] 7 AI providers, local model discovery
- [x] 13 AI actions with streaming responses
- [x] AI Settings, AI Chat agent
- [x] Custom agents and automations

### Phase 4 — Databases ✅
- [x] 7 database views (Table, Board, Calendar, Gallery, Timeline, List, Chart)
- [x] 20 property types
- [x] Filters, sorts, and property cell editors

### Phase 5 — Advanced Blocks ⏳
- [ ] Columns, synced blocks, TOC
- [ ] Comments, version history, templates

### Phase 6 — Collaboration ⏳
- [x] Yjs WebSocket sync, multi-cursor
- [ ] Permissions, sharing, notifications UI

### Phase 7 — Polish ⏳
- [ ] AI search RAG
- [ ] Mobile responsive design
- [ ] Performance optimizations

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [BlockNote](https://blocknotejs.org/) — the Notion-style block editor
- [Tauri](https://tauri.app/) — the desktop framework
- [Zustand](https://zustand-demo.pmnd.rs/) — state management
- [Vercel AI SDK](https://ai-sdk.dev/) — unified AI interface
