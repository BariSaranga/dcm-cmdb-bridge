# CI Strategy

## Jobs
- backend-lint-test
- backend-integration
- ui-lint-test
- security (non-blocking)
- docker-build

## Triggers
- push to main
- pull_request

## Requirements
- CI must pass before merge

---

## Graph Coverage in CI
- Backend tests must include graph builder unit tests.
- UI tests must include Graph page smoke/component coverage.

---

## Lie Detector Validation

- Demo scenario tests must pass
- AI logic tested with mocked LLM responses
- CI fails on hallucination or missing evidence
