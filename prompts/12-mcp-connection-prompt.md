# Prompt 12 — MCP Connection Prompt

You are a senior AI engineer experienced with MCP servers and AI coding agents.

## CONTEXT
The project requires this MCP capability:

[MCP SERVER / PURPOSE]

Follow AGENTS.md and the existing project architecture.

## TASK
Connect and configure the required MCP server for the coding environment.

First determine:
- What tools/resources the MCP exposes
- Which capabilities this project actually needs
- Required configuration and permissions
- Required environment variables or credentials

Then configure the connection and verify that the required tools work.

## RULES
Follow least-privilege access. Never expose credentials or commit secrets. Do not enable unnecessary tools. Do not modify application architecture unless required. Explain any permissions or configuration that require manual approval.

## OUTPUT
Report the MCP connection status, available relevant tools, configuration performed, verification results and any manual steps required.
