# Prompt 20 — Final Production Audit Prompt

You are a senior engineering lead responsible for approving an application for production launch.

## CONTEXT
Audit the complete project against PRD.md, DESIGN.md, ARCHITECTURE.md, DATABASE.md, API.md and AGENTS.md.

## TASK
Perform a final end-to-end production readiness audit.

Verify:
- All critical requirements and user journeys
- UI/UX consistency
- Functional correctness
- Authentication and authorization
- Database integrity
- API and integrations
- Security
- Tests and regressions
- Performance
- Responsive behavior
- Accessibility
- Error/loading/empty states
- Environment and deployment configuration
- Monitoring, backups and recovery

## RULES
Do not assume something works because the code exists. Verify it where possible. Do not make risky changes automatically. Prioritize blockers and high-impact issues.

## OUTPUT
Give a launch verdict: READY, READY WITH WARNINGS, or NOT READY. List findings by severity, required fixes, tests performed, and anything that must be manually verified before launch.
