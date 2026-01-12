# DCM-CMDB Bridge

A platform that discovers runtime infrastructure (DCM sources), normalizes entities, detects drift vs CMDB, and syncs changes with governance, approvals, and auditability.

## Features (MVP)

- Kubernetes discovery
- Entity normalization
- Drift detection
- Action workflow with approvals
- Audit logging
- Modern web UI

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend API | Python 3.11 + FastAPI |
| Worker | RQ + Redis |
| Database | PostgreSQL |
| Frontend | React + Vite + TypeScript + Tailwind |
| Local Dev | docker-compose |
| Testing | pytest, vitest, Playwright |
| CI/CD | GitHub Actions |

## Project Structure

```
src/
├── api/          # FastAPI backend
├── worker/       # RQ background worker
└── ui/           # React frontend
docs/
└── adr/          # Architecture Decision Records
infra/            # Docker and infrastructure configs
.github/
└── workflows/    # CI/CD pipelines
```

## Development Setup

_Coming in Phase 2_

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Execution Phases](PHASES.md)
- [Testing Strategy](TESTING.md)
- [CI Strategy](CI.md)
- [Project Rules](RULES.md)

## License

Proprietary
