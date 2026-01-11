# Testing Strategy

## Backend
- Unit: normalization, drift, RBAC
- Integration: API + DB
- Contract: OpenAPI snapshot

## UI
- Unit/component tests (vitest)
- E2E smoke (Playwright)

## Rules
- No live Kubernetes required
- Deterministic fixtures only
