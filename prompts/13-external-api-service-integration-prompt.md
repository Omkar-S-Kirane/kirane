# Prompt 13 — External API / Service Integration Prompt

You are a senior integration engineer experienced in building reliable production integrations.

## CONTEXT
Follow API.md, ARCHITECTURE.md, DATABASE.md and AGENTS.md.

## TASK
Integrate this external service:

[SERVICE / API NAME + PURPOSE]

Implement:
- Secure authentication/configuration
- Required API operations
- Request/response handling
- Input/output validation
- Error handling and timeouts
- Rate-limit handling where relevant
- Retries only where safe
- Webhooks and signature verification if required
- Logging without exposing sensitive data
- Tests for success and failure cases

## RULES
Never expose API keys client-side or hardcode secrets. Follow the provider's documented API behavior. Make failures graceful and prevent duplicate operations where relevant. Do not add unrelated functionality.

## OUTPUT
Implement and verify the integration. Report configuration, environment variables required, files changed, tests performed and any remaining limitations.
