# ADR-0005: System Architecture Visualizer Module

## Status
Proposed

## Context
We need a clear and impressive visual representation of the platform architecture.
It should be easy to understand, interactive, and kept up to date as the system evolves.

## Decision
Add an "Architecture" module:
- Single source of truth model file: docs/architecture/system-model.yaml
- API endpoints to serve model and diagrams
- UI page to render diagram and drilldown details
MVP rendering uses Mermaid, with possible future upgrade to React Flow.

## Consequences
Positive:
- Faster onboarding and stakeholder communication
- Strong demo value
- Clear linkage between docs and implementation

Negative:
- Requires maintaining the model file (mitigated by CI checks later)

## Impacted Areas
- UI (Architecture page)
- Backend (model endpoints)
- Docs (system model file)
- Testing and CI (diagram validity checks)
