# ADR-0003: Infrastructure Truth vs Org Reality
## (The Infrastructure Lie Detector)

## Status
Accepted

## Context
Organizations do not fail due to lack of monitoring or data,
but due to a persistent gap between:

- Runtime infrastructure truth (what actually runs in production)
- Organizational reality (CMDB, ownership, approvals, audit expectations)

In practice:
- CMDB says X
- Reality says Y
- No one owns the gap

This creates security risk, audit failures, and bureaucratic paralysis.
Existing tools surface data but fail to explain responsibility and blockers.

## Decision
Introduce a core differentiating feature:
Infrastructure Truth vs Org Reality (The Infrastructure Lie Detector)

This feature visually and conversationally exposes:
- Runtime truth
- CMDB reality
- Bureaucratic blockers

It is designed as a demo-first, viral, explainable artifact.

## Visual Model
Three-column reality view:

Left - Runtime Truth
- Kubernetes graph
- Services, ingresses, namespaces
- Node states: green (ok), yellow (drift), red (risk)

Center - CMDB Reality
- CMDB records (mock in MVP)
- CI status: present / missing / stale
- Owner known / unknown

Right - Bureaucracy Layer
- Ownership gaps
- Approval chains
- Drift duration and blockers

Header overlay:
"This service has been running in production for 8 months.
No owner. No CMDB record. Publicly exposed."

## AI Layer - Ask the Infrastructure
The AI provides evidence-based explanations.

Mandatory response structure:
- Summary
- Evidence
- Inference + confidence
- Why this matters (risk/regulation)
- Suggested actions

Guardrails:
- No guessing
- No hallucination
- No auto-apply

The AI is decision-support only.

## Consequences
Positive:
- Strong differentiation
- Viral demo potential
- Clear platform-level thinking

Negative:
- Requires disciplined UX
- Requires deterministic demo data

## Notes
Initial success is defined as one perfect demo scenario,
not full platform coverage.
