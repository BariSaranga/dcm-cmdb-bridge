# Execution Phases and Checkpoints

## Phase 1 - Repo Scaffolding
Checkpoint:
- src/, docs/, infra/, .github/ exist
- README.md and .gitignore
Commit: chore: scaffold repo

## Phase 2 - Backend Core
Checkpoint:
- FastAPI app running
- DB connected
- /health endpoint
Commit: feat(api): bootstrap backend

## Phase 3 - Discovery + Normalization
Checkpoint:
- Kubernetes collector works with fixtures
- Normalized snapshot stored
Commit: feat(discovery): k8s + normalization

## Phase 4 - Drift + Actions
Checkpoint:
- Drift records created
- Propose/approve/apply works
- Audit log populated
Commit: feat(drift): drift + actions

## Phase 5 - UI MVP
Checkpoint:
- Dashboard
- Drifts table + details
- Approvals + audit
Commit: feat(ui): mvp ui

## Phase 6 - Tests
Checkpoint:
- Backend unit + integration tests
- UI tests
Commit: test: comprehensive tests

## Phase 7 - CI
Checkpoint:
- All CI jobs green
Commit: ci: github actions

## Phase 5.5 - Infrastructure Graph (Runtime + CMDB)
Checkpoint:
- UI Graph page exists with:
  - zoom/pan, search, filters
  - drift overlay coloring
  - node drilldown side panel (Overview, Ownership, CMDB Mapping, Drift, Actions, Audit)
- Backend provides:
  - graph snapshot build and storage
  - GET latest snapshot endpoints
- Graph shows both Runtime nodes and CMDB nodes with "mapped-to" edges
Commit: feat(graph): infra visualization with cmdb comparison

## Phase 6.5 - Infrastructure Lie Detector (Viral Demo Phase)

Checkpoint:
- Three-column view: Runtime / CMDB / Bureaucracy
- AI explanation rendered below the graph
- Graph highlights driven by AI answers
- One polished, documented demo scenario
- Screenshot-ready UI

Commit: feat(viral): infrastructure truth vs org reality
