# Sovereign Autonomous AI Workbench

A local-first AI workbench designed to run AI models, conversations, document intelligence, retrieval, agents, and tools on local infrastructure.

The project is being developed as a prototype with a focus on **local execution, modular architecture, privacy, and extensibility**.

---

## Features

### Current Foundation

* React + Vite frontend
* FastAPI backend
* SQLite application database
* Local Ollama LLM integration
* Streaming AI responses
* User authentication
* Protected workspace
* Persistent chat history
* Multi-turn conversation memory
* Chat creation and deletion
* Local API service layer
* Basic activity/audit foundation
* Local-only backend execution

### Planned / In Development

* AI Router with `Auto` model selection
* Support for multiple local open-weight LLMs
* Document upload and processing
* PDF parsing
* OCR for scanned documents
* RAG pipeline
* Qdrant vector database
* LangGraph agent
* Tool calling
* Calculator tool
* File search tool
* Web search tool
* Python execution
* Docker-based Python sandbox
* Word document generation
* Expanded activity/audit logs

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│                 Frontend                    │
│                                             │
│        React + Vite                         │
│        Workspace UI                         │
│        Chat Interface                       │
│        Model Selector                       │
└─────────────────────┬───────────────────────┘
                      │
                      │ HTTP / SSE
                      ▼
┌─────────────────────────────────────────────┐
│                 Backend                     │
│                                             │
│        FastAPI                              │
│        Authentication                       │
│        Chat API                             │
│        LLM Integration                      │
│        AI Router                            │
│        RAG                                  │
│        Agent System                         │
└───────────┬─────────────┬───────────────────┘
            │             │
            ▼             ▼
      ┌──────────┐   ┌──────────────┐
      │ SQLite   │   │   Ollama     │
      │ Database │   │ Local LLMs   │
      └──────────┘   └──────────────┘
                           │
                           ▼
                    Local Open Models

                 Future Components
                 ──────────────────
                 Qdrant
                 LangGraph
                 Docker Sandbox
                 OCR / PDF Pipeline
                 Local Document Store
```

---

## Project Structure

```text
.
├── backend/
│   ├── api/
│   │   ├── auth.py
│   │   └── chat.py
│   │
│   ├── database/
│   │   └── database_sql.py
│   │
│   ├── llm/
│   │   └── ollama.py
│   │
│   ├── main.py
│   ├── requirements.txt
│   └── run_backend.bat
│
├── public/
│
├── src/
│   ├── components/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ChatContext.jsx
│   ├── layouts/
│   │   └── WorkspaceLayout.jsx
│   ├── pages/
│   └── services/
│       ├── api.js
│       ├── auth.js
│       └── chat.js
│
├── package.json
├── vite.config.js
└── README.md
```

---

## Requirements

Install the following before running the project:

### Frontend

* Node.js
* npm

### Backend

* Python 3.x
* pip

### Local LLM

* Ollama

The application currently communicates with Ollama locally.

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd backend
py -m pip install -r requirements.txt
```

Return to the project root:

```bash
cd ..
```

---

## Running the Project

The frontend and backend should be run in **separate terminals**.

### 1. Start the Backend

From the project root:

```bash
cd backend
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 2. Start the Frontend

Open another terminal in the project root:

```bash
npm.cmd run dev
```

Vite will provide the local development URL, normally:

```text
http://localhost:5173
```

Open that URL in your browser.

---

## Ollama Setup

The workbench uses Ollama for local LLM execution.

Make sure Ollama is installed and running before using the chat functionality.

Check that Ollama is available:

```bash
ollama list
```

The backend communicates with the local Ollama service.

The current implementation supports streaming responses from Ollama and maintains conversation history through the application database.

### Example model

The original prototype uses:

```text
qwen3:4b
```

Additional local models can be installed as required:

```bash
ollama pull <model-name>
```

The upcoming AI Router will allow the user to select a specific model or use:

```text
Auto
```

to let the router select an appropriate local model.

---

## Database

The application uses **SQLite** for application persistence.

The database stores application-level data such as:

* Users
* Chats
* Messages
* Audit/activity information

SQLite keeps the prototype simple and allows the workbench to operate locally without requiring a separate database server.

---

## Chat Flow

The current chat flow is approximately:

```text
User
  │
  ▼
React Chat UI
  │
  ▼
FastAPI /api/chat
  │
  ▼
Conversation History
  │
  ▼
Ollama
  │
  ▼
Streaming Response
  │
  ▼
React UI
```

Follow-up messages are associated with the same chat and conversation history.

---

## Development Roadmap

### Phase 1 — Foundation

* [x] React/Vite frontend
* [x] FastAPI backend
* [x] SQLite persistence
* [x] Authentication
* [x] Chat persistence
* [x] Multi-turn conversation support
* [x] Ollama integration
* [x] Streaming responses
* [x] Frontend API service layer

### Phase 2 — LLM Router

* [ ] LLM abstraction layer
* [ ] Multiple local Ollama models
* [ ] Model capability definitions
* [ ] `Auto` routing option
* [ ] Rule-based model selection

### Phase 3 — Documents & RAG

* [ ] Document upload
* [ ] PDF extraction
* [ ] OCR
* [ ] Text chunking
* [ ] Embeddings
* [ ] Qdrant integration
* [ ] Semantic retrieval
* [ ] Context injection into conversations

### Phase 4 — Autonomous Agent

* [ ] LangGraph agent
* [ ] Agent state
* [ ] Tool execution
* [ ] Tool result handling
* [ ] Agent streaming events

### Phase 5 — Tools & Sandbox

* [ ] Calculator
* [ ] File search
* [ ] Web search
* [ ] Python execution
* [ ] Docker Python sandbox

### Phase 6 — Workbench Integration

* [ ] Unified AI workflow
* [ ] RAG + agent integration
* [ ] Document-aware conversations
* [ ] Word document generation
* [ ] Improved audit logs
* [ ] Final prototype UI

---

## Design Principles

### Local First

The system is designed to execute locally wherever practical.

### Privacy

User conversations and application data are intended to remain within the local environment unless a future feature explicitly requires an external service.

### Modular

LLM providers, retrieval, agents, tools, and sandbox execution are separated into independent modules so they can evolve without rewriting the entire application.

### Prototype First

The project intentionally avoids unnecessary enterprise infrastructure.

The goal is to demonstrate the core capabilities of a sovereign AI workbench before introducing additional complexity.

---

## Development Workflow

The project is divided into modular workstreams.

Example branches:

```text
feature/llm-router
feature/rag-documents
feature/agent-tools
```

Recommended integration order:

```text
LLM + Router
      ↓
Documents + RAG
      ↓
Agent + Tools + Sandbox
      ↓
UI Integration
      ↓
End-to-End Testing
```

---

## Troubleshooting

### Backend does not start

Verify Python:

```bash
py --version
```

Install dependencies:

```bash
cd backend
py -m pip install -r requirements.txt
```

Then start the backend again:

```bash
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend does not start

Verify Node.js:

```bash
node --version
```

Install dependencies:

```bash
npm install
```

Then run:

```bash
npm.cmd run dev
```

### Ollama is unavailable

Check Ollama:

```bash
ollama list
```

Make sure the Ollama service is running and that at least one model is installed.

---

## Verification

Before committing changes, verify:

### Frontend

```bash
npm.cmd run build
```

### Backend

```bash
cd backend
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Then verify the API through:

```text
http://127.0.0.1:8000/docs
```

### End-to-End

Verify the following manually:

1. Open the frontend.
2. Create an account.
3. Log in.
4. Create a new chat.
5. Send a message.
6. Confirm the response streams correctly.
7. Send a follow-up message.
8. Confirm the conversation remains in the same chat.
9. Create another chat.
10. Confirm chat history persists.

---

## License

This project is currently a prototype. Add the project's intended license here before public distribution.

---

## Status

**Project status: Active Prototype**

The core local AI workbench foundation is operational. The next major development stage is the integration of the **multi-model AI Router, document/RAG pipeline, LangGraph agent, tools, and sandbox execution**.
