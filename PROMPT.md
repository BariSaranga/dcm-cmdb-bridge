# DCM–CMDB Bridge – Claude Execution Prompt

## Role
You are Claude Code acting as a senior platform engineer and architect.

Your job is to bootstrap a production-oriented SaaS platform that bridges
DCM runtime truth with CMDB systems, starting with Kubernetes and a mock CMDB,
and later extending to ServiceNow.

Do NOT rush execution.
First understand, then plan, then execute in phases.

---

## Product Overview

**Name:** DCM–CMDB Bridge  
**One-liner:**  
A platform that discovers runtime infrastructure, normalizes entities,
detects drift against CMDB, and applies governed sync actions with full auditability.

---

## Core Concepts

### DCM Sources
- Kubernetes (first)
- Cloud accounts (later)
- CI/CD metadata
- IAM / NHI
- Network exposure

### CMDB
- Mock CMDB (local DB) for MVP
- ServiceNow connector interface (not full impl yet)

### Normalized Entities
- Asset
- Service
- Component
- Environment
- Owner / Team
- Dependency
- Exposure
- Identity (NHI-ready)

### Drift Types
- Structural (missing / extra entities)
- Ownership (no owner, mismatch)
- Security (exposed without classification)
- Lifecycle (stale / orphan)

---

## Architecture (MVP)

Collectors → Normalization → Drift Engine → Action Workflow → CMDB Interface  
                                      ↘ UI + Audit Log

---

## Tech Stack

- Backend: Python 3.11 + FastAPI
- Workers: Celery or RQ + Redis
- DB: Postgres
- Frontend: React + Vite + TypeScript + Tailwind
- Local dev: docker-compose
- Tests: pytest, vitest, Playwright (smoke)
- CI: GitHub Actions

---

## Execution Rules

- Never delete files
- Prefer small commits
- Stop and explain if auth is needed
- Always show plan before running large changes
- Work in phases

---

## Required Phases

### Phase 0 – Planning (MANDATORY FIRST STEP)
- Read repo structure
- Summarize understanding
- Propose phased execution plan
- WAIT for approval

### Phase 1 – Repo & Structure
- Create folders
- README
- .gitignore

### Phase 2 – Backend Core
- Models
- Normalization
- Drift engine
- API endpoints

### Phase 3 – UI Skeleton
- Dashboard
- Drift list
- Drift details
- Mock auth

### Phase 4 – Tests
- Unit
- Integration
- API contract
- Basic e2e

### Phase 5 – CI
- Backend tests
- UI tests
- Docker build
- Security checks (non-blocking)

---

## First Instruction

DO NOT RUN COMMANDS YET.

1. Read this file fully.
2. Summarize your understanding in your own words.
3. Propose a clean execution plan with phases and commits.
4. Ask for confirmation.

