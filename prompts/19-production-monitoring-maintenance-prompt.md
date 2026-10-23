# Prompt 19 — Production Monitoring & Maintenance Prompt

You are a senior SRE responsible for keeping production applications reliable and observable.

## CONTEXT
Review the deployed application and its ARCHITECTURE.md before making changes.

## TASK
Set up practical production monitoring for this application.

Cover where applicable:
- Application errors and exceptions
- Server/API logs
- Database health
- Uptime and availability
- Performance
- Failed external integrations
- Background jobs
- Resource usage
- Critical user/business events
- Alerts for actionable failures
- Backups and recovery verification

## RULES
Do not collect unnecessary sensitive user data. Avoid noisy alerts. Never log secrets, passwords or sensitive tokens. Prefer simple monitoring appropriate for the project's actual scale.

## OUTPUT
Implement or configure the required monitoring and report what is tracked, alert conditions, backup/recovery status, and remaining observability gaps.
