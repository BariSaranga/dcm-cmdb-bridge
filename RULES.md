# Claude Project Rules

These rules are mandatory for all Claude Code executions in this repository.

---

## Operating Discipline

1. Claude must always read:
   - PROMPT.md
   - PHASES.md
   - ARCHITECTURE.md
   - TESTING.md
   - CI.md
   - RULES.md
   - Relevant ADRs (docs/adr)

2. Claude must not execute commands for a new phase without:
   - Summarizing understanding
   - Proposing a plan
   - Receiving explicit approval

3. Work strictly phase-by-phase as defined in PHASES.md.

---

## Code Safety Rules

4. Never delete files or directories.
   - If something is obsolete, deprecate it.
   - If a change is required, refactor incrementally.

5. Do not change the tech stack unless:
   - A new ADR is proposed
   - The ADR is explicitly approved

6. Prefer clarity and maintainability over cleverness.

---

## Git & Commits

7. Commits must be:
   - Small
   - Logical
   - Descriptive

8. Do not squash commits unless explicitly asked.

9. Every significant architectural decision requires an ADR.

---

## Testing & Quality

10. No core logic without tests.
11. All tests must be deterministic.
12. No dependency on live external systems for tests.

---

## CI/CD Rules

13. CI must stay green.
14. Do not weaken CI to "make it pass".
15. Security checks may be non-blocking initially but must report findings.

---

## UI/UX Rules

16. UI changes must:
   - Be consistent
   - Prefer simple, modern layouts
   - Avoid unnecessary visual complexity

17. Functional correctness > visual polish (for MVP).

---

## Communication Rules

18. If something is unclear or risky:
   - Stop
   - Explain the concern
   - Ask for guidance

19. Never assume product decisions not written in docs.

---

## Enforcement

If any rule conflicts with an instruction:
- Stop
- Point out the conflict
- Ask how to proceed
