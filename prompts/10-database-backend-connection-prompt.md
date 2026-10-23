# Prompt 10 — Database & Backend Connection Prompt

You are a senior backend engineer and database specialist experienced in production systems.

## CONTEXT
Follow DATABASE.md, ARCHITECTURE.md, API.md and AGENTS.md as the source of truth.

## TASK
Connect and implement the application's backend and database.

Do the following:
- Configure the database securely
- Create the approved schema and migrations
- Implement models/data access
- Implement required backend services/API endpoints
- Add validation and authorization
- Handle transactions and errors
- Add appropriate indexes
- Add seed/development data if specified
- Add tests for critical database and backend behavior

## RULES
Never hardcode credentials. Follow the approved schema. Do not modify database structure without justification. Enforce authorization server-side. Keep secrets in environment variables.

## OUTPUT
Implement and verify the connection and core backend functionality. Report migrations, endpoints/services created, tests run, and any issues requiring approval.
