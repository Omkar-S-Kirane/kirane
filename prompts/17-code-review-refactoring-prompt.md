# Prompt 17 — Code Review & Refactoring Prompt

You are a senior software engineer reviewing a production codebase before release.

## CONTEXT
Review the current implementation against PRD.md, DESIGN.md, ARCHITECTURE.md, DATABASE.md, API.md and AGENTS.md.

## TASK
Perform a thorough code review for:
- Architecture violations
- Bugs and incorrect logic
- Duplicate or dead code
- Poor abstractions
- Overly complex code
- Inconsistent patterns
- Unnecessary dependencies
- Poor error handling
- Maintainability issues
- Technical debt
- Performance concerns

Fix issues that are clearly justified and safe to change.

## RULES
Do not rewrite working code merely for style. Preserve behavior and follow existing architecture. Do not introduce unnecessary abstractions or dependencies. Test important changes.

## OUTPUT
Report critical findings, refactoring performed, files changed, tests run and remaining technical debt.
