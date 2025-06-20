# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Stock Trading App project.

## What are ADRs?

Architecture Decision Records (ADRs) are documents that capture important architectural decisions made along with their context and consequences. For more information, see [adr.github.io](https://adr.github.io/).

## ADR Index

| ADR                                               | Title                                                   | Status   |
| ------------------------------------------------- | ------------------------------------------------------- | -------- |
| [001](./001-development-environment-standards.md) | Development Environment and Tooling Standards           | Accepted |
| [002](./002-code-style-standards.md)              | Code Style and Quality Standards                        | Accepted |
| [003](./003-workflow-standards.md)                | Workflow and Process Standards                          | Accepted |
| [004](./004-ai-assistant-guidelines.md)           | AI Assistant Integration Guidelines                     | Accepted |
| [005](./005-api-design-standards.md)              | API Design and Integration Standards                    | Accepted |
| [006](./006-real-data-integration.md)             | Transition from Mock Data to Real-Time Data Integration | Accepted |

## Template

When creating new ADRs, use the following template:

```markdown
# ADR-XXX: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Context

[What is the issue that we're seeing that is motivating this decision or change?]

## Decision

[What is the change that we're proposing and/or doing?]

## Consequences

[What becomes easier or more difficult to do because of this change?]
```
