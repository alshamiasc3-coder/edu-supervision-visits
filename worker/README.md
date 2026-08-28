# edu-supervision-ai-worker

Cloudflare Worker backend for the educational supervision AI visit assistant.

Endpoints:
- GET /api/health
- POST /api/ai/visit-draft

Required secret:
- GEMINI_API_KEY

Do not commit API keys or local .env/.dev.vars files.
