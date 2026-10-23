# Prompt 9 — Feature Development Prompt

You are a senior full-stack engineer working inside an existing production codebase.

## CONTEXT
Follow PRD.md, DESIGN.md, ARCHITECTURE.md, DATABASE.md, API.md and AGENTS.md. Implement only this approved task:

[TASK / FEATURE]

## TASK
First inspect the relevant existing code and dependencies. Briefly determine the implementation approach, then implement the feature completely.

Requirements:
- Follow existing architecture and design system
- Reuse existing components/utilities
- Handle loading, empty, success and error states
- Validate inputs and enforce authorization
- Update database/API code when required
- Add or update relevant tests
- Keep changes focused

## RULES
Do not rewrite unrelated code or introduce unnecessary dependencies. Do not silently change requirements. If a blocking ambiguity exists, stop and ask.

## OUTPUT
Implement, test, and report changed files, tests performed, and any remaining issues.
