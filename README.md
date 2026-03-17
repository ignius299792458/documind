# DOCU_MIND

DocuMind is a local-first AI document intelligence app powered by RAG (Retrieval-Augmented Generation). Upload PDFs, Word docs, or web URLs and chat with your documents. It uses hybrid retrieval (BM25 + dense vectors with RRF fusion), cross-encoder re-ranking, and confidence thresholds to deliver accurate, source-cited answers without hallucination.

## HOW TO RUN DOCUMIND LOCALLY?

### 1. Start the backend services

Everything runs from the `backend` directory:

```bash
cd backend
```

**Start the Ollama service:**

```bash
docker compose up -d ollama
```

**Pull the required models (one-time):**

```bash
# One time to pull the ollama models
docker compose run --rm ollama-pull
```

This downloads `llama3.2` (chat) and `nomic-embed-text` (embeddings) into a persistent volume. It runs once and exits — you don't need to run it again unless you wipe volumes.

**Start ChromaDB and the API:**

```bash
docker compose up -d chromadb documind-api
```

Or bring everything up at once after the initial model pull:

```bash
docker compose up -d
```

The API will be available at `http://localhost:8000` (docs at `/docs`).

To stop all services:

```bash
docker compose down        # stop containers
docker compose down -v     # stop and wipe all data
```

### Alternative: Run the backend via IDE debugger

If you prefer running the FastAPI server through your IDE debugger instead of Docker, you can use the provided debugger configuration.

**For VS Code / Cursor:**

```bash
cp backend/debugger_config.json backend/.vscode/launch.json
```

Create the `.vscode` directory first if it doesn't exist:

```bash
mkdir -p backend/.vscode
cp backend/debugger_config.json backend/.vscode/launch.json
```

Then open the `backend` folder in your IDE, go to **Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D), select **"FastAPI"** from the dropdown, and hit the play button. This launches uvicorn with `--reload` using your local `.venv` Python and reads environment variables from `backend/.env`.

**For other IDEs** (PyCharm, etc.), create an equivalent run configuration using the values from `backend/debugger_config.json`:

- Module: `uvicorn`
- Arguments: `documind_backend.main:app --reload`
- Working directory: `backend/`
- Environment variable: `PYTHONPATH=src`
- Python interpreter: `backend/.venv/bin/python`

> **Note:** You still need Ollama and ChromaDB running. Start them with Docker before launching the debugger:
>
> ```bash
> cd backend
> docker compose up -d
> ```

Once the backend is running and healthy at `http://localhost:8000`, start the client.

### 2. Start the client

```bash
cd client
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`.

## HOW TO INTERACT WITH DOCUMIND?

**Upload documents** — Use the sidebar buttons to upload files (PDF, DOCX, TXT, MD, HTML) or ingest a web URL.

**Chat** — Go to the Chat page, optionally select specific documents from the right panel, type a question and get streaming answers with source citations.

**DocuDeep** — Go to the DocuDeep page for deep, non-streaming analysis. Select documents on the left, ask a question, and get a detailed answer with ranked source chunks and relevance scores.

**Settings** — Go to the Settings page to tune model parameters: creativity temperature, retrieval top-K, rerank top-N, and confidence threshold. Changes take effect immediately on the backend.

# FORUM

If you face any problem while running the documind on your device, feel free to start a github repo issue at `https://github.com/ignius299792458/documind/issues` or emailing me `bogatimahesh.dev@gmail.com`
