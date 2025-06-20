# ADR-004: AI Assistant Integration Guidelines

## Status

Accepted

## Context

This project integrates AI assistants for development tasks, requiring specific guidelines to ensure effective collaboration between human developers and AI systems. The AI assistant needs clear instructions for command usage, file management, and development practices.

## Decision

We establish the following AI assistant integration guidelines:

### Command and Environment Standards

- **Shell Preference**: AI must use PowerShell commands exclusively
- **Python Environment**: AI must ensure sklearn-env environment is active
- **Project Context**: AI must understand this is NOT a Python project (primarily TypeScript/JavaScript)

### Permitted Commands (Always-Allow)

The following commands are pre-approved for AI assistant use:

- `Remove-Item` - File and directory removal
- `Get-ChildItem` - Directory listing and file discovery
- `Move-Item` - File and directory moving operations
- `Copy-Item` - File and directory copying
- `cd` - Directory navigation
- `netstat` - Network port and connection monitoring
- `taskkill` - Process termination
- `curl` - HTTP requests and API testing
- `Invoke-WebRequest` - Web requests and downloads
- `Get-Process` - Process monitoring

### Development Assistance Guidelines

- **File Editing**: Close files in IDE after editing operations
- **Process Management**: Monitor for hanging processes and terminate when necessary
- **Error Handling**: Proactive identification and resolution of compilation errors
- **Testing**: Run builds and tests after significant changes
- **Documentation**: Update relevant documentation when making architectural changes

### AI-Specific Constraints

- **No Breaking Changes**: AI must not break existing working functionality
- **Context Awareness**: AI must read and understand existing code before making changes
- **Incremental Changes**: Prefer small, focused changes over large refactoring
- **Verification**: AI must verify changes compile and work correctly

### Communication Standards

- **Explanation Required**: AI must explain what changes are being made and why
- **Status Updates**: Provide clear status updates during long-running operations
- **Error Reporting**: Report and attempt to fix errors encountered during development

## Consequences

### Positive

- Efficient AI-assisted development with clear boundaries
- Reduced risk of AI making inappropriate or breaking changes
- Streamlined command approval process
- Better integration between human and AI development workflows

### Negative

- Additional overhead in AI instruction and monitoring
- Potential limitations on AI flexibility for edge cases
- Need for ongoing refinement of AI guidelines

## Implementation Notes

- Regular review and update of AI guidelines based on experience
- Monitoring of AI assistant performance and adherence to guidelines
- Documentation of successful AI-assisted development patterns
- Training materials for human developers working with AI assistants
- Quick reference guidelines available at project root (`CLAUDE.md`) and in GitHub instructions (`/.github/instructions/CLAUDE.md.instructions.md`)
- GitHub instructions include frontmatter for automatic application to AI assistants
