# AI Chat Features Backlog

> Exhaustive feature inventory across ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok, DeepSeek.
> Prioritize and implement as needed for AuraMind.

---

## 1. 🏗️ Workspace & Canvas

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 1 | Canvas / Collaborative Workspace — side-by-side document/code editor with inline editing, length sliders, reading level | ChatGPT, Claude | Requires new panel component |
| 2 | Projects / Spaces — persistent containers with custom knowledge base, instructions, file uploads | ChatGPT, Claude, Perplexity | Could reuse deck as "project" |
| 3 | Custom GPTs / Gems / Skills — user-created mini-apps with custom instructions + actions | ChatGPT, Gemini, Claude | Map to AuraMind study modes |
| 4 | Folders for organizing conversations | ChatGPT, TypingMind | Simple UI grouping |
| 5 | Pinned / Starred / Archived conversations | ChatGPT, Claude | Toggle on conversation items |
| 6 | Conversation search with keyword highlighting | Claude, ChatGPT | Client-side filter + highlight |
| 7 | Chat History Search | User list | See #6 |
| 8 | Shared links / Public chat sharing | ChatGPT, Claude | Generate shareable URL |
| 9 | Export conversation (PDF, TXT, JSON, Markdown) | ChatGPT, Claude | Download button |
| 10 | Branching / Alternative responses — fork at any point | Claude | Fork icon on messages |

---

## 2. 🧠 AI Intelligence & Reasoning

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 11 | Extended Thinking / Deep Reasoning — visible chain-of-thought | Claude, ChatGPT, Gemini | Show reasoning toggle |
| 12 | Deep Research mode — multi-step autonomous cited report | ChatGPT, Perplexity, Gemini | Triggers multi-turn search |
| 13 | Model switching (GPT-4o ↔ o3 ↔ 5.5) | ChatGPT, Perplexity | Dropdown in header |
| 14 | Adaptive Reasoning — internal compute allocation | Claude | API param effort level |
| 15 | Memory — persistent cross-session context | ChatGPT, Claude | Store key facts in localStorage |
| 16 | Custom Instructions / System Prompt — user profile + guidelines | ChatGPT, Claude | Edit panel in settings |
| 17 | Temporary Chat / Incognito mode | ChatGPT | Flag on conversation |
| 18 | Agentic multi-step execution — plan + act autonomously | Claude, OpenAI Codex | Already have app_action tools |

---

## 3. 🎤 Multimodal Input

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 19 | File Upload Button | User list | File picker + read as text |
| 20 | Image upload + analysis (screenshots, charts, OCR) | ChatGPT, Claude, Gemini | Requires vision API |
| 21 | PDF / Document reading with full-text extraction | ChatGPT, Claude, Gemini | PDF.js extraction |
| 22 | Spreadsheet / CSV analysis with data viz | ChatGPT, Claude | Parse CSV + render chart |
| 23 | Video upload + analysis | Gemini, GPT-5.5 | Far future |
| 24 | Audio upload + transcription | Gemini, ChatGPT | Whisper integration |
| 25 | Zip file upload (batch processing) | ChatGPT | Unzip + read contents |
| 26 | Drag & drop file attachment | Claude, ChatGPT | HTML5 drag-drop zone |
| 27 | Voice Input Mic | User list | Web Speech API (done) |
| 28 | Screen / webcam share for real-time vision | Claude, ChatGPT | Screen capture API |

---

## 4. 🎨 Output & Rendering

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 29 | Artifacts / rendered outputs — interactive HTML, SVG, Mermaid | Claude | Iframe sandbox rendering |
| 30 | Code syntax highlighting with language label | ChatGPT, Claude | Prism/Shiki (done via markdown) |
| 31 | Collapsible Code Blocks | User list | Toggle collapse on pre tags |
| 32 | Code copy button | ChatGPT, Claude | Per-code-block copy |
| 33 | Code execution sandbox — run Python/JS server-side | ChatGPT, Claude | Pyodide in iframe |
| 34 | Inline data visualization (charts from data) | ChatGPT, Claude | Chart.js or ECharts |
| 35 | Markdown rendering | All | react-markdown (done) |
| 36 | LaTeX / MathJax rendering | ChatGPT, Claude | KaTeX integration |
| 37 | Mermaid diagram rendering | Claude | mermaid.js in iframe |
| 38 | Expandable Data Tables | User list | Click-to-expand on tables |
| 39 | Interactive Image Zooms | User list | Lightbox on images |
| 40 | Video Playback Inline | User list | HTML5 video player |
| 41 | Audio Player Widget | User list | HTML5 audio player |

---

## 5. 💬 Chat Interaction

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 42 | Quick Reply Buttons | User list | Predefined answer buttons |
| 43 | Suggested Next Steps / Follow-up chips | User list | Dynamic after each response (done) |
| 44 | Carousel Cards | User list | Horizontal scroll cards |
| 45 | Typing Indicators | User list | Bouncing dots (done) |
| 46 | Response Feedback Icons (thumbs up/down) | User list | Per-message feedback (done) |
| 47 | Emoji Reaction Triggers | User list | Emoji picker on messages |
| 48 | Message Copy Button | User list | Per-message clipboard (done) |
| 49 | Text Regeneration Icon (one-click retry) | User list | Regenerate last response (done) |
| 50 | Edit sent messages (edit & resubmit) | ChatGPT, Claude | Click-to-edit user msg (done) |
| 51 | Alternative response variants | Claude | View other completions |
| 52 | Streaming response indicator | All | Live token stream |
| 53 | Auto-scroll to latest with pause-on-scroll-up | All | Scroll logic (done) |
| 54 | Stop generation button (mid-stream) | ChatGPT, Claude | StopCircle button (done) |
| 55 | Context window usage indicator | Claude, TypingMind | Progress bar of context |
| 56 | Token count / cost estimate | API tools | Per-response display |

---

## 6. 🔍 Research & Sources

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 57 | Web search grounding (live results) | ChatGPT, Perplexity, Gemini | Search API integration |
| 58 | Source Citation Tooltips / footnotes | User list | Hover citation source |
| 59 | Inline citations with source links | Perplexity, ChatGPT | Numbered citations |
| 60 | Search query refinement suggestions | Perplexity | Suggested rephrasings |
| 61 | Model Council / multi-model comparison | Perplexity | Run same prompt on 19 models |

---

## 7. 🛠️ App Actions & Integrations

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 62 | MCP (Model Context Protocol) — 6,000+ integrations | Claude | Tool-use protocol |
| 63 | Plugin marketplace / Actions | ChatGPT | Third-party action registry |
| 64 | Google Workspace integration | Gemini | Docs, Sheets, Gmail |
| 65 | Microsoft 365 integration | Copilot | Word, Excel, Outlook |
| 66 | CRM integration (HubSpot, Salesforce) | Business bots | Webhook connectors |
| 67 | Gmail / Google Drive / Calendar connection | ChatGPT, Gemini | OAuth flows |
| 68 | Interactive Forms (inside chat) | User list | Form renderer in chat |
| 69 | Inline Date Pickers | User list | Date input widget |
| 70 | Drop-Down Selection Menus | User list | Select widget |
| 71 | Product Rating Stars | User list | Star rating input |
| 72 | Location Sharing Pins | User list | Map pin picker |
| 73 | Progress Tracking Bars | User list | Study session progress (done) |
| 74 | Hyperlink Cards (rich link previews) | User list | Link unfurl cards |

---

## 8. 🔊 Voice & Audio

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 75 | Voice Input Mic | User list | Web Speech API (done) |
| 76 | Text-to-Speech Toggle / Read Aloud | User list | SpeechSynthesis (done) |
| 77 | Advanced Voice Mode (real-time, emotional) | ChatGPT | WebRTC streaming |
| 78 | Voice cloning / custom voice | ElevenLabs, ChatGPT | API integration |

---

## 9. 🎨 Personalization & UI

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 79 | Welcome Screen Prompts | User list | Quick start cards (done) |
| 80 | Theme Toggle Switch (dark/light) | User list | CSS variable swap |
| 81 | Font Size Adjuster | User list | CSS variable slider |
| 82 | Language Selector Dropdown | User list | i18n integration |
| 83 | Persistent Bottom Menu | User list | Action bar (done) |
| 84 | Floating Action Launcher | User list | FAB button |
| 85 | Unread Message Badge | User list | Notification dot |
| 86 | Keyboard shortcuts / Command Palette (Cmd+K) | ChatGPT, Claude | Cmd+K modal (done) |
| 87 | Slash commands (type / for quick actions) | Discord, TypingMind | / menu (done) |
| 88 | Typing Autocomplete Suggestions | User list | Inline autocomplete |
| 89 | Clear Conversation Trashcan | User list | Delete all button |

---

## 10. 📦 Export, Share & Collaboration

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 90 | Download Transcript Link | User list | Export as .md (done) |
| 91 | Chat Pop-Out Window | User list | Window.open chat |
| 92 | Minimize Chat Chevron | User list | Collapse sidebar (done) |
| 93 | Close Chat Cross | User list | Close/X button |
| 94 | Team workspaces with roles + permissions | ChatGPT, Claude | Multi-user orgs |
| 95 | Guest access for external collaborators | Claude | Share link with access |
| 96 | Collaborative editing (multiple users) | ChatGPT Canvas | Real-time sync |
| 97 | Admin dashboard with usage analytics | Enterprise | Usage stats chart |

---

## 11. 🔐 Security & Compliance

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 98 | SOC 2 / HIPAA / GDPR compliance badges | Enterprise | Badge display |
| 99 | Zero data retention mode | Claude, ChatGPT Ent | Opt-out toggle |
| 100 | PII redaction | Enterprise | Auto-mask PII |
| 101 | Audit logs | Enterprise | Conversation log |
| 102 | SSO (Google, Microsoft, Apple, SAML) | Enterprise | OAuth providers |
| 103 | Trusted contact safety feature | ChatGPT | Emergency contact |

---

## 12. 🧰 Developer & Power User

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 104 | API key management interface | TypingMind, OpenAI | Key input + test |
| 105 | Token usage statistics / analytics | OpenAI, TypingMind | Usage charts |
| 106 | Rate limiting visibility | API platforms | Limit indicator |
| 107 | Prompt templates / prompt library | TypingMind | Saved prompt snippets |
| 108 | Model parameter controls (temperature, top_p) | API tools | Sliders in settings |
| 109 | Batch processing / bulk API | OpenAI Batch | Queue multiple requests |
| 110 | System prompt editor | Claude, ChatGPT | Editable system message |

---

## 13. 🧩 Niche / Emerging

| # | Feature | Origin | Notes |
|---|---------|--------|-------|
| 111 | In-Chat Webviews (rendering web pages) | User list | Iframe sandbox |
| 112 | Live Agent Request Trigger (human handoff) | User list | Support ticket creation |
| 113 | Podcast generation (NotebookLM style) | Google | Auto audio deep-dive |
| 114 | File creation (Excel, Word, PPT, PDF) | Claude | Office file generation |
| 115 | Computer Use (Claude controls cursor) | Claude | Remote desktop AI |
| 116 | Image generation inline (DALL-E) | ChatGPT | Text-to-image API |
| 117 | Image editing / inpainting | ChatGPT | Masked edit |
| 118 | Video generation (Sora) | ChatGPT | Text-to-video |
| 119 | Memory sources — shows what info was used | ChatGPT | Source annotation |

---

**Legend:**
- **(done)** = already implemented in AIChat.tsx
- **User list** = from the original user-provided feature list
- Items without notes = not yet implemented, available for future sprints
