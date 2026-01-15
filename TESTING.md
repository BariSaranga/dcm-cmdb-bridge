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

---

## Graph Testing (Runtime + CMDB)

### Backend
- Unit:
  - graph builder: node/edge creation from fixtures
  - mapping logic: runtime->cmdb match and stale detection
  - drift overlay assignment
- Integration:
  - build graph snapshot writes to DB and can be fetched via API

Fixtures:
- runtime normalized snapshot JSON (k8s)
- mock cmdb items JSON
- expected graph nodes/edges counts and key relations

### UI
- Component tests:
  - Graph page renders
  - Filters affect visible nodes
  - Selecting node opens drilldown panel
- E2E smoke:
  - open Graph page
  - search for a service
  - open node details
  - verify CMDB mapping tab shows status (mapped/missing/stale)

---

## Lie Detector Demo Testing

- Deterministic single-service demo dataset
- Snapshot-based AI response validation
- Validate:
  - Evidence maps to real entities
  - Confidence is present
  - Graph highlights match explanation
