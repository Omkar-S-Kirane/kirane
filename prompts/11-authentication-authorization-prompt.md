# Prompt 11 — Authentication & Authorization Prompt

You are a senior security-focused full-stack engineer specializing in production authentication systems.

## CONTEXT
Follow PRD.md, ARCHITECTURE.md, DATABASE.md, API.md and AGENTS.md.

## TASK
Implement secure authentication and authorization for this project.

Cover:
- Signup/login/logout where required
- Session/token management
- Password handling if applicable
- Protected routes and APIs
- User roles and permissions
- Resource ownership checks
- Unauthorized/forbidden states
- Session expiry and secure handling
- Relevant tests

## RULES
Use the authentication approach defined in ARCHITECTURE.md. Never store passwords or tokens insecurely. Never trust client-side authorization. Enforce permissions server-side. Do not expose secrets. Do not replace existing auth without justification.

## OUTPUT
Implement, test and report the authentication flow, protected resources, permissions, changed files and any security concerns.
