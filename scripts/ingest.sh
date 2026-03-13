# ── POST /ingest — upload a PDF ───────────────────────────────────────────────
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/your/document.pdf" | jq .

# Expected:
# {
#   "doc_id": "550e8400-e29b-41d4-a716-446655440000",
#   "filename": "document.pdf",
#   "status": "ready",
#   "message": "Successfully ingested 'document.pdf'. 12 page(s) → 63 chunk(s) stored."
# }


# ── POST /ingest — upload a DOCX ─────────────────────────────────────────────
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/contract.docx" | jq .


# ── POST /ingest — upload a TXT ──────────────────────────────────────────────
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/notes.txt" | jq .


# ── POST /ingest — upload a Markdown file ────────────────────────────────────
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/README.md" | jq .


# ── POST /ingest — upload HTML ───────────────────────────────────────────────
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/page.html" | jq .


# ── POST /ingest — test unsupported file type (should return 400) ─────────────
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/image.jpg" | jq .

# Expected:
# {
#   "detail": "File type '.jpg' is not supported. Allowed extensions: .docx, .html, .md, .pdf, .txt"
# }


# ── POST /ingest — test file too large (should return 413) ───────────────────
# Create a 51MB dummy file to test the size limit
dd if=/dev/zero of=/tmp/bigfile.pdf bs=1M count=51
curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/tmp/bigfile.pdf" | jq .

# Expected:
# {
#   "detail": "File size 51.0MB exceeds maximum allowed size of 50MB."
# }


# ── POST /ingest/url — ingest from a URL ─────────────────────────────────────
curl -s -X POST http://localhost:8000/ingest/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "display_name": "Wikipedia - AI Article"
  }' | jq .

# Expected:
# {
#   "doc_id": "abc-456",
#   "filename": "Wikipedia - AI Article",
#   "status": "ready",
#   "message": "Successfully ingested 'Wikipedia - AI Article'. 1 section(s) → 24 chunk(s) stored."
# }


# ── POST /ingest/url — without display_name ──────────────────────────────────
curl -s -X POST http://localhost:8000/ingest/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.python.org/3/tutorial/index.html"
  }' | jq .


# ── FULL WORKFLOW: ingest then verify ────────────────────────────────────────
# Step 1: Ingest a file and capture the doc_id
DOC_ID=$(curl -s -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf" | jq -r '.doc_id')

echo "Ingested doc_id: $DOC_ID"

# Step 2: Verify it appears in the document list
curl -s http://localhost:8000/documents | jq .

# Step 3: Verify metadata for this specific document
curl -s http://localhost:8000/documents/$DOC_ID | jq .