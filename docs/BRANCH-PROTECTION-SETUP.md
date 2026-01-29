# Branch Protection Setup Guide

This guide shows you how to configure GitHub branch protection to require all CI checks to pass before merging PRs.

## Required Status Checks

The following three jobs must pass before a PR can be merged to master:

1. **`test`** - Runs linter, builds the project, and runs all tests
2. **`security`** - Runs security scans (yarn audit, Trivy)
3. **`deploy-dev`** - Deploys to dev environment and runs smoke tests

## Step-by-Step Configuration

### 1. Navigate to Branch Protection Settings

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Branches** (left sidebar under "Code and automation")

### 2. Create or Edit Branch Protection Rule

**If you don't have a rule for master yet:**
1. Click **Add branch protection rule**
2. In "Branch name pattern", enter: `master` (or `main` if that's your default branch)

**If you already have a rule:**
1. Click **Edit** next to the existing `master` branch rule

### 3. Configure Required Settings

Check the following options:

#### Basic Protection
- ✅ **Require a pull request before merging**
  - This prevents direct pushes to master
  - All changes must go through a PR

#### Status Checks
- ✅ **Require status checks to pass before merging**
  - This is the key setting that enforces CI checks

- ✅ **Require branches to be up to date before merging**
  - Ensures the PR has the latest master changes

#### Select Required Status Checks

In the search box under "Status checks that are required", type and select:

1. Type `test` → Click to select ✅
2. Type `security` → Click to select ✅
3. Type `deploy-dev` → Click to select ✅

**Important:** These status checks will only appear in the list **after** they've run at least once on a PR. If you don't see them yet:
- Create a test PR first
- Wait for CI to run
- Come back to this settings page to select them

#### Code Review (Optional)

- ⬜ **Require approvals** - UNCHECK this if you want to merge your own PRs
  - If checked, set "Required number of approvals" to 0
  - This allows solo developers to merge without needing another reviewer

### 4. Save Changes

1. Scroll to the bottom
2. Click **Create** (for new rules) or **Save changes** (for existing rules)

### 5. Verify Configuration

After saving, you should see:

```
Branch protection rule: master

✅ Require a pull request before merging
✅ Require status checks to pass before merging
   - test
   - security
   - deploy-dev
✅ Require branches to be up to date before merging
```

## What This Means

### ✅ PRs Will Be Blocked If:
- Linter fails
- Tests fail
- Build fails
- Security scan job fails to complete
- Dev deployment fails
- Smoke tests fail
- Branch is not up to date with master

### ✅ PRs Can Be Merged When:
- All three jobs complete successfully (green checkmarks)
- Branch is up to date with master
- (Optional) Required reviewers have approved

### ⚠️ Note on Security Check

The `security` job has `continue-on-error: true` on its steps, which means:
- The job itself must complete (not crash or timeout)
- But individual security findings won't block the merge
- You'll see security warnings but can still merge

This is by design - security issues are informational rather than blocking.

## Testing Your Configuration

### Step 1: Create a Test PR

```bash
git checkout -b test/branch-protection
echo "test" >> README.md
git add README.md
git commit -m "Test branch protection"
git push origin test/branch-protection
```

### Step 2: Open PR on GitHub

1. Go to your repository
2. Click "Compare & pull request"
3. Create the PR

### Step 3: Verify Protection is Working

You should see:
- Three status checks appear: `test`, `security`, `deploy-dev`
- Each shows as "pending" or "running"
- **Merge button is disabled** with message: "Merging is blocked - Required status checks must pass"

### Step 4: Wait for Checks to Complete

Once all three checks pass (green checkmarks):
- **Merge button becomes enabled**
- Message changes to: "All checks have passed"

### Step 5: Try to Merge Before Checks Pass

While checks are still running:
- Notice the merge button is greyed out
- Hover over it to see "Required status checks must pass before merging"

## Troubleshooting

### "I don't see test/security/deploy-dev in the status checks list"

**Solution:** These checks only appear after they've run at least once.

1. Create a PR (any PR)
2. Wait for CI to run
3. Go back to Settings → Branches
4. Now you should see them in the search dropdown

### "Merge button is disabled even after checks pass"

**Check:**
- Is "Require branches to be up to date before merging" enabled?
- If yes, click "Update branch" button to merge latest master
- Checks will re-run, then you can merge

### "I want to temporarily bypass branch protection"

**Option 1: Use an admin account**
- Repository admins can check "Include administrators" to apply rules to themselves
- Or uncheck it to bypass rules

**Option 2: Disable the rule temporarily**
- Go to Settings → Branches
- Click "Delete" next to the rule (you can recreate it later)
- Or click "Edit" and uncheck options

**Option 3: Push directly to master (not recommended)**
- Only works if "Require a pull request" is unchecked
- Bypasses all CI checks (dangerous!)

### "Security check keeps failing the PR"

The `security` job should NOT block merges because it uses `continue-on-error: true`.

**If it's blocking:**
1. Check if the job is crashing (not just finding vulnerabilities)
2. Review the CI logs
3. The job must complete successfully even if it finds security issues

**If you want security to be truly blocking:**
1. Edit `.github/workflows/ci.yml`
2. Remove `continue-on-error: true` from the security steps
3. Now security vulnerabilities will block merges

## Recommended Settings

For solo developers:
```
✅ Require a pull request before merging
✅ Require status checks to pass before merging
   - test
   - security
   - deploy-dev
✅ Require branches to be up to date before merging
⬜ Require approvals (unchecked)
```

For teams:
```
✅ Require a pull request before merging
✅ Require status checks to pass before merging
   - test
   - security
   - deploy-dev
✅ Require branches to be up to date before merging
✅ Require approvals (1-2 reviewers)
```

## Related Documentation

- [CI-CD.md](CI-CD.md) - Complete CI/CD workflow documentation
- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
