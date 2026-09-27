# Sovereign Autonomous AI Workbench

A local-first AI workbench designed to run multiple AI models, conversations, document intelligence, retrieval, agents, and tools on local infrastructure.

The project is being developed as an **SIH prototype** demonstrating how a sovereign AI workspace can combine multiple local open-weight models with intelligent model routing and future document/agent capabilities.

---

## Project Status

**Current status: Active Prototype**

### Overall Progress

| Component                            | Status      |
| ------------------------------------ | ----------- |
| React + Vite frontend                | ✅ Completed |
| FastAPI backend                      | ✅ Completed |
| SQLite persistence                   | ✅ Completed |
| Authentication                       | ✅ Completed |
| Chat persistence                     | ✅ Completed |
| Multi-turn conversations             | ✅ Completed |
| Ollama integration                   | ✅ Completed |
| Multiple local LLMs                  | ✅ Completed |
| Streaming responses                  | ✅ Completed |
| Deterministic LLM Router             | ✅ Completed |
| Auto model selection                 | ✅ Completed |
| Routing API                          | ✅ Completed |
| Routing SSE metadata                 | ✅ Completed |
| Router UI indicator                  | ✅ Completed |
| Prototype benchmark/reference scores | ✅ Completed |
| Model benchmarking infrastructure    | ✅ Completed |
| Document upload                      | 🔲 Planned  |
| PDF processing                       | 🔲 Planned  |
| OCR                                  | 🔲 Planned  |
| RAG / Qdrant                         | 🔲 Planned  |
| LangGraph agent                      | 🔲 Planned  |
| Tool calling                         | 🔲 Planned  |
| Python sandbox                       | 🔲 Planned  |
| Word document generation             | 🔲 Planned  |
| Expanded audit system                | 🔲 Planned  |

---

# 1. What Has Been Built

## 1.1 Local AI Workbench Foundation

The core application is operational as a local web application.

### Frontend

Built using:

* React
* Vite
* JavaScript/JSX
* Custom workspace UI

Current capabilities include:

* Login
* Signup
* Protected workspace
* New chat
* Persistent conversations
* Multi-turn conversations
* Model selection
* Streaming responses
* AI response rendering
* Thinking/reasoning display

---

## 1.2 FastAPI Backend

The backend is implemented using FastAPI.

Current backend responsibilities include:

* Authentication APIs
* Chat APIs
* Model listing
* Chat persistence
* Conversation history
* Ollama communication
* Streaming responses
* Router integration

Backend structure:

```text
backend/
├── api/
│   ├── auth.py
│   └── chat.py
├── database/
│   └── database_sql.py
├── llm/
│   └── ollama.py
├── router/
│   ├── config.py
│   ├── detector.py
│   └── router.py
└── main.py
```

---

# 2. Local LLM Integration

The workbench uses **Ollama** for local model execution.

The current prototype supports:

```text
qwen3:4b
gemma3:4b
qwen2.5-coder:3b
```

The models run locally through the Ollama API.

The application supports:

* Model discovery
* Manual model selection
* Automatic model selection
* Streaming generation
* Multi-turn conversation history

The goal is to keep inference local rather than relying on cloud LLM APIs.

---

# 3. LLM Router — Completed

The first major intelligence layer of the workbench is now implemented.

The router is intentionally lightweight and deterministic.

It does **not** use:

* Model training
* XGBoost
* Embeddings
* Vector databases
* A secondary LLM
* Cloud APIs

Instead, it analyzes the incoming prompt locally.

### Router flow

```text
User Prompt
     │
     ▼
Requirement Detection
     │
     ├── Task Type
     ├── Complexity
     └── Requirements
     │
     ▼
Prototype Benchmark Reference Scores
     │
     ▼
Weighted Model Selection
     │
     ▼
Selected Ollama Model
     │
     ▼
Response
```

---

## 3.1 Task Detection

The router currently identifies:

```text
coding
math
reasoning
QA
general
```

It also detects requirements such as:

```text
coding_required
math_required
reasoning_required
retrieval_required
tool_use_required
vision_required
```

Complexity is classified as:

```text
low
medium
high
```

Complexity is currently used as routing metadata rather than as a benchmark score.

---

## 3.2 Benchmark Reference Routing

The router uses configurable prototype benchmark reference scores.

The scores are stored separately from the routing logic so they can be replaced or updated later.

Conceptually:

```text
Task
 │
 ├── qwen3:4b
 ├── gemma3:4b
 └── qwen2.5-coder:3b
```

For mixed requirements, the router can combine relevant dimensions.

For example:

```text
coding + reasoning
        ↓
coding score: 67%
reasoning score: 33%
        ↓
weighted model score
        ↓
selected model
```

The reference scores are explicitly treated as **prototype/reference data**, not as measurements generated during every user request.

---

# 4. Router Validation

The router has been validated against representative prompts.

### Coding

```text
Write a Python function to reverse a linked list.
```

Detected:

```text
Task: coding
Complexity: medium
Requirement: coding
```

Selected:

```text
qwen2.5-coder:3b
```

---

### Mathematics

```text
Solve 2x + 5 = 17.
```

Detected:

```text
Task: math
Complexity: low
Requirement: math
```

Selected:

```text
qwen3:4b
```

---

### Reasoning

```text
Explain why increasing interest rates can reduce inflation.
```

Detected:

```text
Task: reasoning
Complexity: medium
Requirement: reasoning
```

Selected:

```text
qwen3:4b
```

---

### General QA

```text
Explain photosynthesis in simple terms.
```

Detected:

```text
Task: QA
Complexity: low
Requirement: QA
```

Selected:

```text
qwen3:4b
```

---

### Mixed Coding + Reasoning

```text
Debug this Python algorithm and explain its time complexity.
```

Detected:

```text
Task: coding
Complexity: medium
Requirements:
    coding
    reasoning
```

The router combines the relevant benchmark reference scores and selects:

```text
qwen2.5-coder:3b
```

---

# 5. Auto Model Selection

The frontend now provides an:

```text
Auto
```

model option.

When Auto is selected:

```text
User Prompt
     ↓
Router
     ↓
Model Selection
     ↓
Ollama
```

The user can still manually select a specific model when required.

This gives the prototype two modes:

### Automatic

```text
Auto
 ↓
Router
 ↓
Selected Model
```

### Manual

```text
User-selected Model
 ↓
Ollama
```

---

# 6. Routing Transparency

The router exposes its decision instead of silently selecting a model.

The routing result contains:

```text
Selected model
Task type
Complexity
Detected requirements
Comparative model scores
Routing reason
```

Example:

```text
Model: qwen2.5-coder:3b

Task: Coding
Complexity: Medium

Reason:
Highest benchmark reference score for the
detected coding requirements.
```

The routing information is sent to the frontend through the chat's Server-Sent Event stream.

This allows the UI to show how the model was selected.

---

# 7. Routing API

The backend provides a dedicated routing endpoint:

```text
POST /api/route
```

This allows routing decisions to be inspected independently from normal chat execution.

The main chat endpoint also integrates routing automatically when:

```text
model = Auto
```

The selected model is then passed to the existing Ollama streaming layer.

---

# 8. Benchmarking

The repository contains a separate benchmark component:

```text
benchmark/
├── sih_benchmark.py
└── result/
    ├── sih_benchmark_results.csv
    ├── sih_benchmark_results.json
    └── Sovereign_AI_Workbench_Prototype_Benchmark.pdf
```

The benchmark system is separate from runtime routing.

Its purpose is to evaluate and document model performance for the prototype.

Runtime routing does not execute the benchmark for every request.

---

# 9. Current Architecture

```text
                    ┌─────────────────────┐
                    │     React UI        │
                    │                     │
                    │ Chat / Auto / Model │
                    └──────────┬──────────┘
                               │
                             HTTP
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │                     │
                    │ Auth / Chat / Route │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             ┌──────────────┐     ┌──────────────┐
             │ LLM Router   │     │   SQLite     │
             │              │     │              │
             │ Detector     │     │ Users        │
             │ Score Lookup │     │ Chats        │
             │ Selection    │     │ Messages     │
             └──────┬───────┘     └──────────────┘
                    │
                    ▼
             ┌──────────────┐
             │   Ollama     │
             │              │
             │ Qwen3 4B     │
             │ Gemma3 4B    │
             │ Qwen Coder   │
             └──────────────┘
```

---

# 10. Current Project Structure

```text
sovereign-ai-workbench/
│
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── chat.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── database_sql.py
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   └── ollama.py
│   │
│   ├── router/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── detector.py
│   │   └── router.py
│   │
│   ├── main.py
│   ├── requirements.txt
│   └── run_backend.bat
│
├── benchmark/
│   ├── result/
│   │   ├── sih_benchmark_results.csv
│   │   ├── sih_benchmark_results.json
│   │   └── Sovereign_AI_Workbench_Prototype_Benchmark.pdf
│   │
│   └── sih_benchmark.py
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/
│   │   └── hero.png
│   │
│   ├── components/
│   │   ├── AIResponse.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Logo.jsx
│   │   └── ThinkingBlock.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ChatContext.jsx
│   │
│   ├── layouts/
│   │   └── WorkspaceLayout.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── NewChat.jsx
│   │   ├── Overview.jsx
│   │   └── Signup.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── chat.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── pyrightconfig.json
├── README.md
└── vite.config.js
```

---

# 11. Development Progress

## Phase 1 — Core Workbench

**Status: ✅ Completed**

* [x] React/Vite frontend
* [x] FastAPI backend
* [x] SQLite database
* [x] Authentication
* [x] Protected workspace
* [x] Chat creation
* [x] Chat persistence
* [x] Multi-turn conversations
* [x] Ollama integration
* [x] Streaming responses
* [x] Frontend/backend API layer

---

## Phase 2 — Multi-Model AI Router

**Status: ✅ Completed**

* [x] Multiple local Ollama models
* [x] Deterministic task detection
* [x] Requirement detection
* [x] Complexity detection
* [x] Prototype benchmark reference scores
* [x] Weighted routing
* [x] Auto model selection
* [x] Manual model override
* [x] Routing API
* [x] Routing SSE events
* [x] Frontend routing indicator
* [x] Routing fallbacks
* [x] Representative prompt validation

---

## Phase 3 — Documents & RAG

**Status: 🔲 Planned**

* [ ] Document upload
* [ ] PDF extraction
* [ ] OCR
* [ ] Text chunking
* [ ] Embeddings
* [ ] Qdrant
* [ ] Semantic retrieval
* [ ] Context injection

---

## Phase 4 — Autonomous Agent

**Status: 🔲 Planned**

* [ ] LangGraph integration
* [ ] Agent state
* [ ] Tool execution
* [ ] Tool result handling
* [ ] Agent streaming events

---

## Phase 5 — Tools & Sandbox

**Status: 🔲 Planned**

* [ ] Calculator
* [ ] File search
* [ ] Web search
* [ ] Python execution
* [ ] Docker-based Python sandbox

---

## Phase 6 — Workbench Integration

**Status: 🔲 Planned**

* [ ] Unified AI workflow
* [ ] Router + RAG integration
* [ ] Document-aware conversations
* [ ] Agent + tools integration
* [ ] Word document generation
* [ ] Expanded audit logs
* [ ] Final prototype UI

---

# 12. Design Principles

### Local First

The core AI inference is designed to run locally through Ollama.

### Privacy

Conversations and application data are intended to remain within the local environment unless a future feature explicitly requires an external service.

### Modular

The system separates:

```text
Frontend
Backend
Database
LLM Integration
Router
Benchmarking
RAG
Agents
Tools
Sandbox
```

This allows individual components to evolve independently.

### Prototype First

The project is intentionally focused on demonstrating the core architecture before introducing unnecessary infrastructure complexity.

---

# 13. Running the Project

## Backend

```bash
cd backend
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend

From the project root:

```bash
npm.cmd run dev
```

The frontend is normally available at:

```text
http://localhost:5173
```

---

# 14. Ollama Setup

Verify Ollama:

```bash
ollama list
```

Required prototype models:

```text
qwen3:4b
gemma3:4b
qwen2.5-coder:3b
```

Install a missing model:

```bash
ollama pull <model-name>
```

---

# 15. Verification

Before committing changes:

### Frontend

```bash
npm.cmd run build
```

### Backend

```bash
cd backend
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Router

Verify:

```text
POST /api/route
```

Test representative prompts for:

* Coding
* Math
* Reasoning
* General QA
* Mixed coding + reasoning

### End-to-End

Verify:

1. Open the frontend.
2. Log in.
3. Create a chat.
4. Select `Auto`.
5. Send a prompt.
6. Confirm the router selects a model.
7. Confirm the routing indicator appears.
8. Confirm the response streams from Ollama.
9. Send a follow-up message.
10. Confirm conversation history persists.
11. Manually select a model.
12. Confirm manual model selection overrides Auto routing.

---

# 16. Current Milestone

### Milestone 1 — Local AI Foundation

**Completed**

The application can run locally with authentication, persistent conversations, streaming responses, and Ollama integration.

### Milestone 2 — Intelligent Model Routing

**Completed**

The application can analyze incoming prompts and automatically select among multiple local LLMs using deterministic requirement detection and configurable benchmark reference scores.

### Milestone 3 — Document Intelligence

**Next**

The next major development stage is the document and RAG pipeline.

Planned flow:

```text
Document
   ↓
PDF / OCR Processing
   ↓
Text Extraction
   ↓
Chunking
   ↓
Embeddings
   ↓
Qdrant
   ↓
Retrieval
   ↓
LLM Router
   ↓
Local Model
```

---

# 17. Roadmap

```text
                    CURRENT
                       │
                       ▼
             ┌──────────────────┐
             │ Local AI          │
             │ Workbench         │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Multi-Model      │
             │ AI Router        │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Documents + RAG  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Agent + Tools    │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Sandbox +        │
             │ Workbench Tools  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │ Integrated       │
             │ Sovereign AI     │
             │ Workbench        │
             └──────────────────┘
```

---

## Current Summary

The prototype has progressed from a basic local chat application to a **multi-model local AI workbench with an operational deterministic LLM Router**.

The currently completed core is:

```text
React/Vite
    +
FastAPI
    +
SQLite
    +
Ollama
    +
3 Local LLMs
    +
Deterministic AI Router
    +
Auto Model Selection
    +
Streaming Chat
```

The next major focus is **document intelligence and RAG**, followed by autonomous agents, tools, sandbox execution, and full workbench integration.
