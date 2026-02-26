# NetWorth Tracker - Project Notes

> This file tracks development context and changes. Do NOT commit to git.

---

## Session: 2026-02-26 - Testing Framework Implementation

### Overview
Implemented a comprehensive testing framework with Vitest, achieving 100% code coverage on all core library functions. Added 155 unit tests covering financial calculations, utilities, and hooks.

---

### Changes Made

#### Testing Infrastructure
**Files:** `vitest.config.mts`, `tests/setup.ts`, `tests/mocks/*`, `tests/utils/*`
**Description:** Set up Vitest with happy-dom environment, path aliases, and coverage thresholds. Created mock infrastructure for Supabase client, MSW handlers for API mocking, and test data factories.

#### Unit Tests
**Files:** `lib/*.test.ts`, `lib/hooks/*.test.ts`
**Description:** Added comprehensive tests for all pure functions:
- `calculations.ts` - Currency formatting, cash/investment totals, gain/loss calculations
- `fire-calculations.ts` - FIRE number, years to FIRE, projections
- `currencies.ts` - Currency symbol/name lookups
- `expense-categories.ts` - Category filtering and labels
- `exchange-rates.ts` - Currency conversion with caching
- `hooks/use-table-sort.ts` - Table sorting with null handling

#### Custom Skills
**Files:** `.claude/commands/commit.md`, `.claude/commands/update-context.md`
**Description:** Added `/commit` skill for auto-commit with generated messages, and `/update-context` skill for updating PROJECT_NOTES.md.

---

### Files Changed

| File | Changes |
|------|---------|
| `package.json` | Added test scripts and devDependencies |
| `vitest.config.mts` | Vitest configuration with coverage |
| `tests/setup.ts` | Test setup with mocks for next/navigation, next/cache |
| `tests/mocks/supabase.ts` | Chainable Supabase client mock |
| `tests/mocks/server.ts` | MSW server setup |
| `tests/mocks/handlers/frankfurter.ts` | Exchange rate API mock |
| `tests/mocks/data/factories.ts` | Test data factories |
| `tests/utils/render.tsx` | Custom render with providers |
| `lib/calculations.test.ts` | 37 tests for calculation functions |
| `lib/fire-calculations.test.ts` | 35 tests for FIRE calculations |
| `lib/currencies.test.ts` | 16 tests for currency utilities |
| `lib/expense-categories.test.ts` | 17 tests for expense categories |
| `lib/exchange-rates.test.ts` | 18 tests for exchange rate functions |
| `lib/stock-api.test.ts` | 15 tests for stock API utilities |
| `lib/hooks/use-table-sort.test.ts` | 17 tests for table sort hook |
| `.claude/commands/commit.md` | Custom /commit skill |
| `.claude/commands/update-context.md` | Custom /update-context skill |

---

### Test Coverage

| Metric | Coverage |
|--------|----------|
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

**Total: 155 tests passing**

---

### NPM Scripts Added

```bash
npm run test           # Interactive test runner
npm run test:run       # Single test run
npm run test:coverage  # Coverage report
```

---

### Verification

- [x] Build passes (`npm run build`)
- [x] All 155 tests pass (`npm run test:run`)
- [x] 100% coverage achieved (`npm run test:coverage`)
- [x] Lint passes (`npm run lint`)

---

### Branch & Commit Info

- **Branch:** `testing-framework`
- **Commits:** `971e750`, `d78b0a0`
- **Pushed to:** `origin/testing-framework`

---

### Recommendations Completed

From previous session's recommendations:
- [x] **Add test framework** - Vitest with 100% coverage implemented

Remaining recommendations:
- [ ] Add input validation with Zod schemas
- [ ] Add toast notifications for user feedback
- [ ] Replace `confirm()` with AlertDialog
- [ ] Add error boundaries and loading states

---

## Session: 2026-02-22 - Security Review & Fixes

### Overview

Conducted a comprehensive security review of the NetWorth Tracker application and implemented fixes for critical vulnerabilities. The review focused on authentication, authorization, and input validation across server actions and auth flows.

---

### Vulnerabilities Identified

#### 1. Open Redirect Vulnerability (HIGH)
**File:** `app/auth/callback/route.ts`
**Issue:** The `next` query parameter was used directly in redirects without validation, allowing attackers to redirect authenticated users to malicious sites.

**Attack vector:** `?next=//evil.com` would redirect users to external domains after successful authentication.

#### 2. Missing Authentication/Authorization in Server Actions (HIGH)
**File:** `lib/actions.ts`
**Issue:** Multiple server actions performed database mutations without verifying:
- User authentication
- Resource ownership

**Affected functions:**
- `updateAccount()` - No auth, no ownership check
- `deleteAccount()` - No auth, no ownership check
- `upsertCashHolding()` - No auth, no ownership check
- `upsertCpfHoldings()` - No auth, no ownership check
- `deleteCashHolding()` - No auth, no ownership check
- `upsertStockHolding()` - No auth, no ownership check
- `deleteStockHolding()` - No auth, no ownership check
- `updateExpense()` - No auth, no ownership check
- `deleteExpense()` - No auth, no ownership check

**Note:** While Supabase RLS provided database-level protection, missing app-level checks violated defense-in-depth principles.

---

### Fixes Implemented

#### Fix 1: Open Redirect Prevention
**Commit:** `0da4533`

Added `isAllowedRedirectPath()` validation function:
```typescript
function isAllowedRedirectPath(path: string): boolean {
  // Block protocol-relative URLs (//evil.com)
  // Block absolute URLs with protocols (https:, javascript:)
  // Only allow /dashboard/* paths
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(":")) {
    return false;
  }
  return path === "/dashboard" || path.startsWith("/dashboard/");
}
```

#### Fix 2: Authentication & Ownership Verification
**Commit:** `0da4533`

Added to all affected server actions:
1. **Authentication check:** `supabase.auth.getUser()` + throw if not authenticated
2. **Ownership verification:** Query resource, verify `user_id` matches authenticated user

Example pattern:
```typescript
export async function updateAccount(id: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership before update
  const { data: account } = await supabase
    .from("accounts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  // Proceed with update...
}
```

---

### Files Changed

| File | Changes |
|------|---------|
| `app/auth/callback/route.ts` | Added redirect path validation |
| `lib/actions.ts` | Added auth + ownership checks to 9 functions |

---

### Verification Completed

- [x] `npm run build` - Passes
- [x] TypeScript compilation - No errors
- [x] Open redirect fix verified
- [x] Auth checks verified (16 `getUser()` calls)
- [x] Ownership checks verified (9 verification blocks)

---

### Branch & Commit Info

- **Branch:** `security-review`
- **Commit:** `0da4533` - "fix security vulnerabilities in auth callback and server actions"
- **Pushed to:** `origin/security-review`
- **PR URL:** https://github.com/darenleongzy/NetworthTracker/pull/new/security-review

---

### Recommendations for Future Work

#### High Priority
1. **Add test framework** - No tests exist; consider Vitest or Jest
2. **Add input validation** - Use Zod schemas for server action inputs
3. **Add toast notifications** - Replace `console.error` with user feedback in form components
4. **Replace `confirm()` dialogs** - Use shadcn AlertDialog for accessibility

#### Medium Priority
5. **Add error boundaries** - Create `app/dashboard/error.tsx`
6. **Add loading states** - Create `app/dashboard/loading.tsx`
7. **Database constraints** - Add CHECK constraints for non-negative balances

#### Previously Attempted (Reverted)
During this session, additional fixes were implemented but later reverted:
- Zod validation schemas (`lib/validation.ts`)
- Toast notifications in form components
- AlertDialog component and DeleteButton
- Error boundary and loading skeleton

These can be re-implemented in a future session if needed.

---

### Tech Stack Reference

- **Framework:** Next.js 16 with App Router
- **Database:** Supabase (Postgres with RLS)
- **Auth:** Supabase Auth with SSR cookies
- **UI:** shadcn/ui, Tailwind CSS
- **Validation:** Zod (installed but not fully utilized)

---

### Security Model

1. **Authentication:** Supabase Auth with cookie-based sessions
2. **Authorization:**
   - Database: Row Level Security (RLS) policies
   - Application: Explicit ownership checks in server actions (now implemented)
3. **Session Management:** Middleware refreshes sessions automatically

---

*Last updated: 2026-02-26*
