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
