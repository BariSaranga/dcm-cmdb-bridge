# ADR-0006: Data Center Thermal Telemetry Module

## Status
Proposed

## Context
Data center operations require visibility into thermal health of components,
including NVIDIA-related GPU telemetry where applicable.
We want to support multiple telemetry sources and provide heatmaps, trends, and alerts.

## Decision
Add a "Thermals" module:
- Telemetry connectors abstraction
- MVP: mock telemetry + optional Prometheus connector
- Persisted metrics and alerts in Postgres
- UI for heatmaps, drilldown, and alert workflow

## Consequences
Positive:
- Strong differentiation for platform + data center mindset
- Bridges DevOps, Ops, and hardware telemetry
- Enables future AI root-cause explanations

Negative:
- Requires careful data volume handling and retention strategy

## Impacted Areas
- Backend collectors/workers
- DB schema
- UI (Thermals pages)
- Tests and CI
