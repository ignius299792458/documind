# ── GET /health ───────────────────────────────────────────────────────────────
curl -s http://localhost:8000/health | jq .

# Expected:
# {
#   "status": "ok",
#   "version": "0.1.0",
#   "environment": "development",
#   "vector_store_chunk_count": 0
# }


# ── GET /documents — list all ─────────────────────────────────────────────────
curl -s http://localhost:8000/documents | jq .

# Expected (empty at first):
# {
#   "documents": [],
#   "total": 0
# }


# ── GET /documents/{doc_id} — get one ────────────────────────────────────────
# Replace DOC_ID with a real UUID from ingest response
DOC_ID="your-uuid-here"

curl -s http://localhost:8000/documents/$DOC_ID | jq .

# Expected (if found):
# {
#   "doc_id": "abc-123",
#   "filename": "report.pdf",
#   "file_type": "pdf",
#   "chunk_count": 63,
#   "status": "ready"
# }

# Expected (if not found):
# {
#   "detail": "Document 'abc-123' not found."
# }


# ── DELETE /documents/{doc_id} ───────────────────────────────────────────────
DOC_ID="your-uuid-here"

curl -s -X DELETE http://localhost:8000/documents/$DOC_ID | jq .

# Expected:
# {
#   "doc_id": "abc-123",
#   "chunks_deleted": 63,
#   "message": "Successfully deleted 63 chunks for document 'abc-123'."
# }