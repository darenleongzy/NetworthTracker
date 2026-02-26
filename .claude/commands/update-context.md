# Update Project Context

Update PROJECT_NOTES.md with a summary of recent changes and session context.

## Instructions

1. **Gather context about recent changes:**
   - Run `git log --oneline -10` to see recent commits
   - Run `git diff HEAD~5 --stat` to see files changed in recent commits (adjust range as needed)
   - Run `git status` to see any uncommitted changes
   - Read relevant changed files to understand what was done

2. **Read the existing PROJECT_NOTES.md** to understand the format and structure

3. **Create a new session entry** at the top of the file (after the header), following this format:

```markdown
## Session: YYYY-MM-DD - [Brief Title]

### Overview
[1-2 sentence summary of what was accomplished]

---

### Changes Made

#### [Feature/Fix Category]
**Files:** `path/to/file.ts`
**Description:** [What was changed and why]

[Add more categories as needed]

---

### Files Changed

| File | Changes |
|------|---------|
| `path/to/file` | Brief description |

---

### Verification

- [x] Build passes (`npm run build`)
- [x] Tests pass (`npm run test`)
- [ ] Other checks as relevant

---

### Branch & Commit Info

- **Branch:** `branch-name`
- **Commits:** `hash1`, `hash2`
- **Pushed to:** `origin/branch-name`

---

*Last updated: YYYY-MM-DD*
```

4. **Update the "Last updated" date** at the bottom of the file

5. **Show the user** a summary of what was added to PROJECT_NOTES.md

## Important

- Keep entries concise but informative
- Focus on the "what" and "why", not implementation details
- Include any recommendations or follow-up items
- Preserve existing session entries (append new session at top, after header)
- Use today's date from the system (currently available in context)
