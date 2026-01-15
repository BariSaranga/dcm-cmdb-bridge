# Architecture Overview

## Flow
Collectors -> Normalization -> Snapshot Store -> Drift Engine -> Actions -> Audit -> UI

## Components
- API (FastAPI)
- Worker (RQ)
- Postgres
- Redis
- UI (React)

## Connectors
### Kubernetes
- kubeconfig for dev
- labels/annotations for owner/env inference

### CMDB
- Mock CMDB in Postgres
- ServiceNow interface stub

## Drift Types
- Structural
- Ownership
- Security
- Lifecycle

## Governance
- Role-based approvals
- Full audit trail

---

## Infrastructure Graph (MVP: Runtime + CMDB)

### Goal
Provide a visual map of the discovered runtime infrastructure and the CMDB view,
highlighting gaps ("truth vs CMDB") and enabling drilldown for ownership and governance.

### Data Sources
- Runtime layer: normalized entities from Kubernetes discovery snapshot
- CMDB layer: mock CMDB items stored in Postgres (MVP)
- Drift layer: computed drift records (structural/ownership/security/lifecycle)

### Storage Model (recommended for MVP)
Store snapshots so UI is fast and audits are consistent.

Tables:
- graph_snapshots(id, created_at, source, metadata)
- graph_nodes(snapshot_id, node_id, node_type, name, env, owner, severity, cmdb_ref, runtime_ref, metadata)
- graph_edges(snapshot_id, from_node_id, to_node_id, relation_type, metadata)

Node types:
- runtime: Cluster, Namespace, Workload, Service, Ingress, Node
- cmdb: CMDB_CI (and optional CMDB_Service)
- helper: Owner/Team (optional, can be represented as metadata)

Edge types:
- runtime relations: runs_in, exposes, selects, depends_on
- mapping relations: mapped_to_cmdb, missing_in_cmdb, stale_in_cmdb
- governance: owned_by (can be metadata-first in MVP)

### Graph Build Algorithm (MVP)
1) Parse latest normalized runtime snapshot and create runtime nodes/edges
2) Load CMDB mock records and create cmdb nodes
3) Match runtime entities to cmdb items using mapping rules:
   - name + env + type + tags (configurable later)
4) Emit mapping edges:
   - mapped_to_cmdb if matched
   - missing_in_cmdb if no match
   - stale_in_cmdb for cmdb items not seen in runtime
5) Overlay drift:
   - attach drift_type/severity to nodes and/or edges

### API
- GET /graph/snapshots/latest
- GET /graph/snapshots/{id}
- POST /graph/snapshots/build (optional internal endpoint)

### UI
Graph View:
- Sidebar navigation: Graph
- Search, filters, layer toggles
- Node drilldown side panel with:
  - Overview
  - Ownership (inference + confidence)
  - CMDB Mapping (matched CI / missing / stale)
  - Drift (records + diff)
  - Actions (propose/approve/apply)
  - Audit (history)

---

## Infrastructure Lie Detector Layer

Purpose:
Expose and explain discrepancies between runtime infrastructure and organizational records.

Structure:
- Runtime graph (DCM truth)
- CMDB graph
- Bureaucracy context (ownership, approvals, blockers)

AI Layer:
Consumes graph snapshots, CMDB records, drift data, and audit logs.
Produces evidence-based explanations with confidence and action suggestions.
