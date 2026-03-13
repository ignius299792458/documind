# ─────────────────────────────────────────────────────────────────────────────
# SETUP: Ingest a document first, then use its doc_id in queries below
# ─────────────────────────────────────────────────────────────────────────────
DOC_ID=$(curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf" | jq -r '.doc_id')

echo "doc_id: $DOC_ID"


# ── POST /query — basic question across all docs ──────────────────────────────
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this document about?",
    "doc_ids": null,
    "top_k": 3
  }' | jq .

# Expected:
# {
#   "answer": "This document is about ...",
#   "sources": [
#     {
#       "doc_id": "...",
#       "filename": "document.pdf",
#       "page": 1,
#       "chunk_index": 0,
#       "content": "...",
#       "relevance_score": 0.94
#     }
#   ],
#   "has_relevant_context": true
# }


# ── POST /query — scoped to one specific document ────────────────────────────
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d "{
    \"question\": \"Summarize the key points\",
    \"doc_ids\": [\"$DOC_ID\"],
    \"top_k\": 3
  }" | jq .


# ── POST /query — scoped to multiple documents ───────────────────────────────
DOC_ID_1="uuid-1-here"
DOC_ID_2="uuid-2-here"

curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d "{
    \"question\": \"What do these documents have in common?\",
    \"doc_ids\": [\"$DOC_ID_1\", \"$DOC_ID_2\"],
    \"top_k\": 5
  }" | jq .


# ── POST /query — test "I don't know" (irrelevant question) ──────────────────
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the weather like on Mars today?",
    "doc_ids": null
  }' | jq .

# Expected:
# {
#   "answer": "I don't have enough information in the provided documents...",
#   "sources": [],
#   "has_relevant_context": false
# }


# ── POST /query — test with empty doc store (no docs ingested yet) ────────────
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me about the contract terms",
    "doc_ids": null
  }' | jq .


# ── POST /query/stream — streaming SSE ───────────────────────────────────────
# curl --no-buffer shows tokens as they arrive in real time
curl -s -X POST http://localhost:8000/query/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  --no-buffer \
  -d '{
    "question": "Explain the main topics covered in this document",
    "doc_ids": null
  }'

# Raw output (streaming token by token):
# data: The
# data:  document
# data:  covers
# data:  several
# data:  key
# data:  topics
# ...
# data: [DONE]


# ── POST /query/stream — stream with doc scope ────────────────────────────────
curl -s -X POST http://localhost:8000/query/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  --no-buffer \
  -d "{
    \"question\": \"What are the payment terms?\",
    \"doc_ids\": [\"$DOC_ID\"]
  }"


# ── POST /query/stream — extract clean text (strip "data: " prefix) ──────────
curl -s -X POST http://localhost:8000/query/stream \
  -H "Content-Type: application/json" \
  --no-buffer \
  -d '{
    "question": "Give me a brief summary",
    "doc_ids": null
  }' | grep "^data:" | sed 's/^data: //' | tr -d '\n' | sed 's/\[DONE\]/\n/'


# ── POST /agent/query — multi-step agent (new session) ───────────────────────
curl -s -X POST http://localhost:8000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Compare all the sections related to payment and provide a detailed breakdown",
    "doc_ids": null,
    "session_id": null
  }' | jq .

# Expected:
# {
#   "answer": "Based on multiple sections of the document...",
#   "session_id": "generated-uuid-here",
#   "steps_taken": 3,
#   "sources": [...],
#   "has_relevant_context": true
# }


# ── POST /agent/query — continue a session (pass same session_id) ─────────────
# First turn:
SESSION_ID=$(curl -s -X POST http://localhost:8000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What does section 3 say about liability?",
    "session_id": null
  }' | jq -r '.session_id')

echo "Session ID: $SESSION_ID"

# Follow-up turn (same session_id = conversation memory):
curl -s -X POST http://localhost:8000/agent/query \
  -H "Content-Type: application/json" \
  -d "{
    \"question\": \"How does that compare to section 5?\",
    \"session_id\": \"$SESSION_ID\"
  }" | jq .


# ── POST /query/batch — multiple questions at once ────────────────────────────
curl -s -X POST http://localhost:8000/query/batch \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      "What is the document about?",
      "Who are the key parties mentioned?",
      "What are the main dates or deadlines?"
    ],
    "doc_ids": null
  }' | jq .

# Expected:
# {
#   "results": [
#     {"answer": "...", "sources": [...], "has_relevant_context": true},
#     {"answer": "...", "sources": [...], "has_relevant_context": true},
#     {"answer": "...", "sources": [...], "has_relevant_context": true}
#   ],
#   "total": 3
# }


# ── POST /query/batch — test limit (>10 questions should return 400) ──────────
curl -s -X POST http://localhost:8000/query/batch \
  -H "Content-Type: application/json" \
  -d '{
    "questions": ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11"],
    "doc_ids": null
  }' | jq .

# Expected:
# {
#   "detail": "Batch queries are limited to 10 questions per request."
# }


# ── GET / — root endpoint sanity check ───────────────────────────────────────
curl -s http://localhost:8000/ | jq .

# Expected:
# {
#   "name": "DocuMind API",
#   "version": "0.1.0",
#   "status": "running",
#   "docs": "/docs"
# }