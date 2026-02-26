# Commit and Push Changes

Commit all staged and unstaged changes with an auto-generated commit message, then push to origin.

## Instructions

1. Run `git status` to see all changed files (staged and unstaged)
2. Run `git diff` to see the actual changes for unstaged files
3. Run `git diff --cached` to see staged changes
4. Analyze the changes and generate a concise commit message:
   - Use conventional commit format when appropriate (feat:, fix:, docs:, refactor:, test:, chore:)
   - First line should be under 72 characters
   - Add bullet points for multiple changes
   - Focus on the "what" and "why", not the "how"
5. Stage all changes with `git add -A`
6. Commit with the generated message, adding the co-author trailer:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
7. Push to origin using the current branch name
8. Report the commit hash and summary

## Important

- Do NOT commit files that appear to contain secrets (.env, credentials, API keys)
- If there are no changes to commit, inform the user
- If push fails due to upstream changes, inform the user to pull first
