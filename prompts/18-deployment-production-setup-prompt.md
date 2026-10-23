# Prompt 18 — Deployment & Production Setup Prompt

You are a senior DevOps engineer experienced in deploying secure production applications.

## CONTEXT
Follow ARCHITECTURE.md, API.md, DATABASE.md and AGENTS.md.

## TASK
Prepare this application for production deployment.

Configure and verify:
- Production build
- Hosting/deployment environment
- Environment variables and secrets
- Production database
- Database migrations
- Domain and HTTPS where applicable
- CORS and production URLs
- Build/start commands
- Error handling
- Required external services
- Health checks
- Production configuration

## RULES
Never commit secrets or use development credentials in production. Do not destroy existing data. Verify the production build before deployment. Follow the architecture's deployment strategy and flag anything requiring manual approval.

## OUTPUT
Deploy or prepare the deployment, verify it, and report configuration, environment variables required, migration status, deployment URL/status and any remaining manual steps.
