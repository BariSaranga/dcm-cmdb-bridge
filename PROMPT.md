# DCM-CMDB Bridge - Claude Operating Prompt (v5-star)

## Mission
Bootstrap a production-oriented SaaS platform that bridges DCM runtime truth to CMDB.
Start with Kubernetes discovery + mock CMDB, implement drift detection, governed actions, approvals, and audit logs.
Deliver a clean, testable, dockerized repo with CI.

## Operating Mode
- Do not run large command batches without showing a plan.
- Work in phases and small commits.
- Be idempotent and safe. Never delete user data.
- If auth is required (GitHub), pause and tell me exactly what to run.
- Prefer clarity over speed.

## Product Definition
One-liner:
A platform that discovers runtime infrastructure (DCM sources), normalizes entities, detects drift vs CMDB, and syncs changes with governance, approvals, and auditability.

Primary users:
- DevOps / Platform
- Security
- IT Ops

## MVP Scope
- Kubernetes discovery
- Normalization
- Drift detection
- Action workflow with approvals
- Audit log
- Minimal modern UI

## Tech Stack
- Backend: Python 3.11 + FastAPI
- Worker: RQ + Redis
- DB: Postgres
- UI: React + Vite + TypeScript + Tailwind
- Local dev: docker-compose
- Tests: pytest, vitest, Playwright (smoke)
- CI: GitHub Actions

## Execution Rules
- Work strictly by PHASES.md
- Read ARCHITECTURE.md, TESTING.md, CI.md before coding
- Phase 0 is planning only

## First Instruction
1. Read PROMPT.md and all referenced docs.
2. Summarize your understanding.
3. Propose execution plan for Phase 1 only.
4. Wait for approval.

---

## ADR Requirement
Before implementing the Graph feature, read ADR-0002 and confirm it.
If any deviation is needed, propose a new ADR.

---

## CORE DIFFERENTIATOR: Infrastructure Truth vs Org Reality
(The Infrastructure Lie Detector)

The platform must visually and conversationally expose the gap between:
- Runtime infrastructure truth
- CMDB representation
- Organizational ownership and approvals

Primary output:
A screenshot-ready, explainable artifact:
- One service
- One drift
- One AI explanation

### Ask the Infrastructure (AI Copilot)
The AI must:
- Answer natural language questions about infrastructure state
- Be grounded ONLY in graph, CMDB, drift and audit data
- Return structured responses:
  - Summary
  - Evidence
  - Inference + confidence
  - Why this matters
  - Suggested actions

The AI is a decision-support layer and must never auto-apply changes.
