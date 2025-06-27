# ADR-010: Project Structure Standards

**Date**: 2025-06-27  
**Status**: Accepted  
**Deciders**: Development Team

## Context

As the project has evolved into a workspace-based monorepo structure, there have been questions about what constitutes proper file organization, particularly regarding the presence of `node_modules/` in the project root directory. Clear standards are needed to guide development and avoid confusion about project structure.

## Decision

We establish the following project structure standards:

### Approved Root Directory Structure

```
Stock-Trading-App-Nest/
├── .git/                     # Git repository
├── .github/                  # GitHub workflows and CI/CD
├── .gitignore                # Git ignore rules
├── .vscode/                  # VS Code workspace settings
├── backend/                  # NestJS backend application
├── frontend/                 # React frontend application
├── docs/                     # All project documentation
├── e2e-tests/                # End-to-end testing suite
├── project-management/       # Project tracking dashboard
├── test-scripts/             # Development testing scripts
├── node_modules/             # **REQUIRED** workspace dependencies
├── package-lock.json         # Dependency lock file
├── package.json              # Workspace configuration
├── quick-test.ps1           # Quick test runner script
├── run-all-tests.ps1        # Full test suite script
└── README.md                # Project overview
```

### Key Decisions

1. **Root `node_modules/` is Required**: The root `node_modules/` directory is **essential and expected** for our npm workspace-based monorepo structure. It contains:
   - Shared dependencies across all workspace packages
   - Workspace management tools
   - Development dependencies used by multiple packages
   - Root-level tooling (ESLint, Prettier, testing frameworks)

2. **Workspace Structure**: We use npm workspaces to manage multiple packages (backend, frontend, project-management, e2e-tests) from a single root.

3. **Documentation Organization**: All documentation belongs in the `docs/` directory with proper subdirectory organization.

4. **Script Organization**: Development scripts belong in `test-scripts/` while essential runners remain in root.

## Rationale

### Why Root `node_modules/` is Necessary

1. **Workspace Dependencies**: npm workspaces require a root `node_modules/` to manage shared dependencies and prevent duplication.

2. **Development Tooling**: Shared development tools (ESLint, TypeScript, testing frameworks) are installed at the root level for consistency.

3. **Build Performance**: Shared dependencies reduce overall disk usage and installation time.

4. **Monorepo Best Practice**: This follows established monorepo patterns used by major projects.

### Alternative Considered

**Separate Package Management**: Managing each package independently was considered but rejected because:

- Leads to dependency duplication
- Complicates shared tooling configuration
- Makes workspace-level scripts impossible
- Reduces development efficiency

## Consequences

### Positive

- Clear standards for project organization
- Developers understand that root `node_modules/` is intentional and required
- Consistent with npm workspace best practices
- Efficient dependency management

### Negative

- Root directory contains more items than a simple single-package project
- New developers may initially be confused by workspace structure

## Implementation

### Documentation Updates

- [x] Updated `docs/README.md` with correct project structure
- [x] Updated main `README.md` with workspace structure explanation
- [x] Updated `docs/PROJECT-ROOT-CLEANUP-SUMMARY.md` with clarification
- [x] Updated AI assistant guidelines with proper file organization notes

### Guidelines for Developers

1. **Never remove** `node_modules/` from the project root
2. **Use workspace commands** for dependency management: `npm run install:all`
3. **Understand** that root `package.json` is the workspace configuration
4. **Follow** the established directory structure for new files

### Guidelines for AI Assistants

When performing "cleanup" operations:

- **Preserve** the root `node_modules/` directory
- **Organize** loose files into appropriate subdirectories
- **Maintain** the workspace structure integrity
- **Document** any structural changes made

## References

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
- Project workspace configuration in `package.json`

---

**Note**: This ADR establishes permanent standards for project structure. Any future changes to the fundamental workspace organization should be documented in a new ADR.
