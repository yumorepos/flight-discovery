# Quick Test Guide
## Running FlightFinder Protection Tests

**Last Updated:** 2026-03-11

---

## Prerequisites

```bash
cd ~/Projects/flight-discovery/frontend
npm install  # Ensure Playwright is installed
npx playwright install chromium  # Install browser
```

---

## Quick Commands

### 1. Fast Smoke Test (~30s)
```bash
npm run test:smoke
```

**What it checks:**
- App boots without errors
- Backend API reachable
- Homepage renders
- Images load

**Use when:** Before every commit

---

### 2. Full Test Suite (~5min)
```bash
npm test
```

**What it checks:**
- All 35 E2E tests
- Homepage, search, cards
- Full user flows

**Use when:** Before PR/merge

---

### 3. Interactive Test UI
```bash
npm run test:ui
```

**Opens Playwright UI to:**
- Pick which tests to run
- Watch browser in real-time
- Debug failures visually

**Use when:** Debugging test failures

---

### 4. Visual Regression Tests (~3min)
```bash
npx playwright test visual-baseline
```

**What it checks:**
- Screenshots match baseline
- No layout drift
- No styling regressions

**Use when:** After UI changes

---

### 5. Update Visual Baselines
```bash
npm run test:update-snapshots
```

**When to use:**
- After intentional UI redesign
- New feature added to homepage
- Layout intentionally changed

**⚠️ Warning:** Only run if UI changes are expected!

---

## First-Time Setup (Baseline Creation)

### Step 1: Ensure App is Running

**Terminal 1 (Backend):**
```bash
cd ~/Projects/flight-discovery/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd ~/Projects/flight-discovery/frontend
npm run dev
```

**Terminal 3 (Tests):**
```bash
cd ~/Projects/flight-discovery/frontend
npm test  # Creates baselines on first run
```

---

### Step 2: Verify Baseline Screenshots

```bash
ls -la tests/e2e/*.spec.ts-snapshots/
```

**Expected files:**
- `homepage-hero-desktop.png`
- `homepage-full-desktop.png`
- `destination-cards-grid-desktop.png`
- `destination-card-single-desktop.png`
- `homepage-mobile-iphone.png`
- (+ 8 more)

---

### Step 3: Commit Baselines to Git

```bash
git add tests/
git commit -m "chore: add Playwright baseline screenshots"
git push
```

---

## Interpreting Test Results

### ✅ All Tests Pass
```
35 passed (3.5m)
```
**Meaning:** App is stable, no regressions detected  
**Action:** Safe to commit/merge

---

### ❌ Test Failure Example
```
× homepage.spec.ts:45 CRITICAL: should auto-load destination cards
  Error: expect(locator).toBeVisible()
  Call log:
    - waiting for locator('.card')
  
  Screenshot: test-results/homepage-auto-load-chromium/test-failed-1.png
```

**Meaning:** Auto-load broke (cards not rendering)  
**Action:**
1. Open screenshot: `test-results/homepage-auto-load-chromium/test-failed-1.png`
2. Inspect what's wrong (empty state? error message?)
3. Fix code or revert changes

---

### ⚠️ Visual Regression Detected
```
× visual-baseline.spec.ts:23 homepage with auto-loaded cards
  Error: Screenshot comparison failed:
    Expected: tests/e2e/visual-baseline.spec.ts-snapshots/homepage-full-desktop.png
    Actual:   test-results/visual-baseline-chromium/homepage-full-desktop-actual.png
    Diff:     test-results/visual-baseline-chromium/homepage-full-desktop-diff.png
  
  Difference: 1523 pixels (tolerance: 500)
```

**Meaning:** UI changed significantly  
**Action:**
1. Open diff image: `test-results/.../homepage-full-desktop-diff.png`
2. Red pixels = differences detected
3. **If change is intentional:** Run `npm run test:update-snapshots`
4. **If unintentional:** Revert UI changes

---

## Common Issues & Fixes

### Issue 1: Backend Not Running
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000
```

**Fix:**
```bash
# Start backend
cd ~/Projects/flight-discovery/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

---

### Issue 2: Frontend Dev Server Not Running
```
Error: webServer timed out after 120s
```

**Fix:**
```bash
# Start frontend manually in another terminal
cd ~/Projects/flight-discovery/frontend
npm run dev
```

---

### Issue 3: Playwright Browser Not Installed
```
Error: browserType.launch: Executable doesn't exist
```

**Fix:**
```bash
npx playwright install chromium
```

---

### Issue 4: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Kill existing process
pkill -f "next dev"
# Or find and kill manually
lsof -ti:3000 | xargs kill -9
```

---

## CI/CD Integration

### GitHub Actions Auto-Runs Tests On:
- Every push to `main` or `develop`
- Every pull request

### Check CI Status:
1. Go to GitHub repo → **Actions** tab
2. Click on latest workflow run
3. View job results

### If CI Fails:
1. Download "playwright-report" artifact
2. Open `index.html` locally
3. Review failure screenshots
4. Fix issue and push again

---

## Test Development Tips

### Writing New Tests

**Pattern:**
```typescript
test('should do something', async ({ page }) => {
  await page.goto('/');
  
  // Wait for API
  await page.waitForResponse(r => r.url().includes('/api/search'));
  
  // Find element
  const element = page.locator('button:has-text("Search")');
  
  // Assert
  await expect(element).toBeVisible();
});
```

### Debugging Failing Tests

**Use headed mode:**
```bash
npm run test:headed
# Or
npx playwright test --headed --debug
```

**Add breakpoints:**
```typescript
test('debug test', async ({ page }) => {
  await page.goto('/');
  await page.pause();  // Pauses execution, opens inspector
});
```

---

## Performance Benchmarks

| Test Suite | Tests | Time | When to Run |
|------------|-------|------|-------------|
| Smoke | 8 | ~30s | Every commit |
| Homepage | 8 | ~45s | Before PR |
| Search | 7 | ~60s | Before PR |
| Cards | 12 | ~90s | Before PR |
| Visual | 13 | ~150s | After UI changes |
| **Full Suite** | **35** | **~5min** | **Before merge** |

---

## Quick Reference

```bash
# Install
npm ci
npx playwright install chromium

# Run
npm test              # All tests
npm run test:smoke    # Fast check
npm run test:ui       # Interactive
npm run test:headed   # See browser

# Maintain
npm run test:update-snapshots  # Update baselines
npm run test:report            # View last report

# Debug
npx playwright test --debug    # Step-through debugger
npx playwright show-report     # Open HTML report
```

---

**Need Help?** Open Playwright UI (`npm run test:ui`) for interactive debugging.
