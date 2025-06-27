# CRITICAL: Story Completion Workflow

## ⚠️ MANDATORY: Update stories.ts When Finishing Any Ticket

**This is a critical requirement that must be followed for every ticket completion.**

### The Problem

When tickets are completed but `stories.ts` is not updated:

- ❌ Project management dashboard shows incorrect progress
- ❌ Sprint velocity calculations are wrong
- ❌ Epic completion percentages are inaccurate
- ❌ Team progress reports are misleading
- ❌ Project status is not properly tracked

### The Solution

**ALWAYS update `project-management/src/data/stories.ts` when completing tickets.**

### Required Steps for EVERY Ticket Completion:

#### 1. Update stories.ts File

```typescript
// File: project-management/src/data/stories.ts
{
  id: "S##",
  title: "Your Story Title",
  status: "DONE",  // ← Change from "IN_PROGRESS" or other status
  completedDate: "2025-06-27",  // ← Add current date YYYY-MM-DD
  // ...other fields remain the same
}
```

#### 2. Update Story Markdown File

```markdown
# S## - Story Title

**Status**: DONE ← Update this
**Completed**: 2025-06-27 ← Add this line

## Rest of story content...
```

#### 3. Verify in Project Dashboard

- Open project management dashboard (port 5000)
- Check that story shows as "DONE"
- Verify progress metrics are updated

### Quality Checklist for Ticket Completion:

- [ ] Code implemented and tested
- [ ] All tests passing with 90%+ coverage
- [ ] Git commit with proper message
- [ ] **stories.ts updated with DONE status**
- [ ] **stories.ts updated with completion date**
- [ ] **Story markdown file updated**
- [ ] **Project dashboard reflects completion**
- [ ] Sprint/Epic progress updated

### File Locations:

- **Data file**: `project-management/src/data/stories.ts`
- **Story files**: `project-management/stories/S##-story-name.md`
- **Dashboard**: http://localhost:5000 (project management port)

### Impact:

This workflow ensures:

- ✅ Accurate project tracking
- ✅ Correct sprint velocity calculations
- ✅ Proper epic completion percentages
- ✅ Reliable progress reporting
- ✅ Up-to-date project status

## Remember: This is NOT optional - it's a mandatory part of ticket completion!
