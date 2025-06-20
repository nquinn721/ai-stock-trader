# Project Management Dashboard

## Overview

The Stock Trading App project includes a local, code-based project management system for tracking epics, sprints, and stories. This system is fully version-controlled and integrates with a modern React dashboard for visual management.

## Features

- **Markdown-based**: All project management data (epics, stories, sprints) is stored in markdown files under `project-management/`.
- **Local & Versioned**: All changes are tracked in Git, supporting local workflows and history.
- **Automation**: PowerShell scripts automate story creation, sprint planning, and reporting.
- **Visual Dashboard**: A React app provides a modern UI for viewing sprints, tickets, and epics.

## Running the Dashboard

- The dashboard is located at `project-management/dashboard`.
- It is always configured to run on **port 5000** to avoid conflicts with the main frontend (port 3000) and backend (port 8000).

### Start the Dashboard

```powershell
cd project-management/dashboard
npm install
npm start
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

## Directory Structure

```
project-management/
├── dashboard/         # React dashboard (port 5000)
├── epics/             # Epic markdown files
├── stories/           # Story markdown files
├── sprints/           # Sprint markdown files
├── scripts/           # PowerShell automation scripts
├── README.md          # System overview
├── backlog.md         # Product backlog
├── roadmap.md         # High-level roadmap
├── progress.md        # Progress tracking
```

## Integration

- The dashboard reads from the markdown files for up-to-date project status.
- All changes to stories, sprints, and epics should be made via markdown or the provided scripts for consistency.

## Port Policy

- **Frontend**: 3000
- **Backend**: 8000
- **Project Management Dashboard**: 5000 (always reserved for this tool)

## See Also

- [ADR-003: Workflow and Process Standards](./adrs/003-workflow-standards.md)
- [project-management/README.md](../project-management/README.md)
