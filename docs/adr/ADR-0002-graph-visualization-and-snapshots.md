# ADR-0002: Infrastructure Graph Visualization and Snapshot Storage

## Status
Proposed

## Context
We need a clear visualization of runtime infrastructure discovered from DCM sources (starting with Kubernetes)
and CMDB representation (mock CMDB for MVP) to highlight "truth vs CMDB" gaps.
Large organizations suffer from bureaucratic friction. A graph with ownership and mapping context reduces ambiguity,
accelerates alignment, and improves audit readiness.

We must decide:
- UI graph library
- Graph data strategy (snapshot storage vs compute-on-demand)
- Graph schema for nodes/edges and overlays (drift, ownership, mapping)

## Decision
1) UI graph library: React Flow (MVP)
- Rationale: fast to implement, strong UX for pan/zoom, custom nodes, side panels, and good dev ergonomics.

2) Data strategy: store Graph Snapshots in Postgres
- Rationale: faster UI loading, consistent audit trail, stable investigation of past states, reduced compute per request.

3) Schema: graph_snapshots, graph_nodes, graph_edges tables
- Nodes include runtime and cmdb nodes, mapping metadata, owner inference, drift severity.
- Edges include runtime relations and mapping relations (mapped_to_cmdb, missing_in_cmdb, stale_in_cmdb).

## Alternatives Considered
- Cytoscape.js
  - Pros: powerful for very large graphs and algorithms
  - Cons: higher complexity for custom UI patterns and faster MVP delivery
- Compute graph on-demand
  - Pros: no storage needed
  - Cons: slower UI, unstable for audits, repeated compute load

## Consequences
### Positive
- Clear "truth vs CMDB" visibility
- Reduced operational and bureaucratic friction
- Better audit and incident investigations via historical snapshots

### Negative
- Additional DB storage and snapshot lifecycle management
- Need snapshot retention policy later

## Impacted Areas
- Backend: graph builder, snapshot persistence, endpoints
- UI: graph view, drilldown, filters
- Testing: fixtures and graph coverage
- CI: ensure tests cover graph paths

## Notes
After approval:
- Mark as Accepted
- Implement Phase 5.5 in PHASES.md
