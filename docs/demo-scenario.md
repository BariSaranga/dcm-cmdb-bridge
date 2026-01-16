# Infrastructure Lie Detector - Demo Scenario

## Overview

The Infrastructure Lie Detector demonstrates the gap between:
- **Runtime Truth**: What actually runs in production
- **CMDB Reality**: What the organization thinks exists
- **Bureaucracy**: Ownership, approvals, and blockers

## Demo Setup

### Seed the Demo Data

```bash
# Via API
curl -X POST http://localhost:8000/api/v1/demo/seed

# Or via UI
# Navigate to /lie-detector and click "Load Demo"
```

### Access the Demo

Navigate to: `http://localhost:5173/lie-detector`

## The Scenario: payment-service

### The Problem

A service called `payment-service` has been discovered in the production Kubernetes cluster with the following issues:

| Issue | Severity | Impact |
|-------|----------|--------|
| Missing from CMDB | High | No organizational visibility |
| No owner assigned | High | No accountability |
| Publicly exposed without TLS | Critical | Security risk |
| Running for 8 months | - | Long-term shadow IT |

### Runtime Truth (Left Column)

Shows the actual Kubernetes resources:
- `payment-service` Deployment - 3 replicas, running 8 months
- `payment-service-public` Ingress - publicly exposed, no TLS
- `payment-service` Service - ClusterIP

### CMDB Reality (Center Column)

Shows the CMDB state:
- **MISSING**: `payment-service` has no CMDB record
- **TRACKED**: `auth-service` and `api-gateway` are properly tracked
- **STALE**: `legacy-billing` exists in CMDB but not in runtime

### Bureaucracy (Right Column)

Shows organizational blockers:
- Ownership Gap: No one is accountable
- Security Blocker: Public exposure requires remediation
- Suggested Actions:
  1. Enable TLS (Critical)
  2. Assign owner (High)
  3. Create CMDB record (High)

## AI Explanation

The AI provides:
- **Summary**: Natural language description of the situation
- **Evidence**: Grounded facts from runtime, CMDB, drift data
- **Inference**: What this means (95% confidence)
- **Risk Assessment**: Why this matters (compliance, security)
- **Suggested Actions**: Prioritized remediation steps

### Sample Headline

> "This service has been running in production for 8 months. No owner. No CMDB record. Publicly exposed."

## Contrasting Entities

For comparison, the demo includes well-managed services:

| Service | Owner | CMDB Status | Drift |
|---------|-------|-------------|-------|
| auth-service | platform-team | Tracked | None |
| api-gateway | platform-team | Tracked | None |

## Screenshot-Ready Views

The UI is designed for:
1. Executive presentations
2. Audit evidence
3. Security reviews
4. Team accountability discussions

## API Endpoints

### Demo Management

```bash
# Seed demo data
POST /api/v1/demo/seed

# Get demo scenario info
GET /api/v1/demo/scenario
```

### AI Explanation

```bash
# Get explanation for any entity
GET /api/v1/ai/explain/{entity_type}/{namespace}/{entity_name}

# Get pre-built demo explanation
GET /api/v1/ai/demo

# POST variant
POST /api/v1/ai/explain
{
  "entity_type": "Deployment",
  "entity_name": "payment-service",
  "namespace": "production"
}
```

## Response Structure (ADR-0003)

```json
{
  "summary": "Natural language summary...",
  "headline": "Short impactful statement...",
  "evidence": [
    {
      "source": "runtime|cmdb|drift|audit",
      "entity_type": "Deployment",
      "entity_name": "payment-service",
      "fact": "Description of the fact",
      "data": { "key": "value" }
    }
  ],
  "inference": "What this means...",
  "confidence": 0.95,
  "why_it_matters": "Risk and compliance impact...",
  "risk_level": "critical|high|medium|low",
  "suggested_actions": [
    {
      "action": "enable_tls",
      "priority": "critical",
      "description": "Enable TLS encryption",
      "rationale": "Protect data in transit"
    }
  ],
  "highlighted_nodes": ["runtime:Deployment:production:payment-service"]
}
```

## Guardrails

Per ADR-0003:
- No guessing - all facts are grounded in data
- No hallucination - evidence is traceable
- No auto-apply - AI is decision-support only
