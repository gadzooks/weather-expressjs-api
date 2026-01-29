# Dependabot Automated Workflow

This document explains how Dependabot automatically handles dependency updates from PR creation through production deployment.

## Automated Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Monday 9 AM PT: Dependabot scans for updates               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Dependabot PR   │
              │  Created         │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Auto-Approve    │ ← dependabot-auto-merge.yml
              │  (Instant)       │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  CI Triggered    │ ← ci.yml
              │  - Lint          │
              │  - Build         │
              │  - Tests         │
              │  - Security Scan │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Deploy to Dev   │ ← ci.yml (deploy-dev job)
              │  - SAM Deploy    │
              │  - Smoke Test    │
              └────────┬─────────┘
                       │
                       │ (All checks passed)
                       │
                       ▼
              ┌──────────────────┐
              │  Auto-Merge      │ ← dependabot-auto-merge.yml
              │  Squash to Master│
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Deploy to QA    │ ← deploy-qa.yml
              │  (Automatic)     │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Production      │ ← Manual trigger when ready
              │  (Manual)        │
              └──────────────────┘
```

## What Gets Auto-Merged

**✅ Automatically merged (no human intervention):**

- Minor version updates (e.g., `1.2.0` → `1.3.0`)
- Patch updates (e.g., `1.2.0` → `1.2.1`)
- GitHub Actions version updates (requires `PAT_TOKEN` secret - see setup below)
- All updates are grouped together to reduce PR noise

**❌ Requires manual review:**

- Major version updates (e.g., `1.x.x` → `2.0.0`)
  - These may contain breaking changes
  - Dependabot will create the PR but it won't auto-merge
  - You must review and merge manually

**⚠️ Special Case: GitHub Actions Updates**

- GitHub Actions updates modify workflow files (`.github/workflows/`)
- GitHub's `GITHUB_TOKEN` cannot merge PRs that modify workflows (security restriction)
- **Solution:** Set up a `PAT_TOKEN` secret (instructions below)
- **Without PAT:** npm packages auto-merge, but GitHub Actions updates require manual merge

## Configuration Files

### 1. `.github/dependabot.yml`

Configures Dependabot behavior:

- **Schedule:** Weekly on Mondays at 9 AM PT
- **Grouping:** Minor/patch updates grouped into single PRs
- **Limits:** Max 10 open PRs at a time
- **Ignores:** Major version updates (manual review required)
- **Labels:** Adds `dependencies` and `automated` labels

### 2. `.github/workflows/dependabot-auto-merge.yml`

Handles automatic approval and merging:

- **Triggers:** On Dependabot PR creation/update
- **Auto-approve:** Immediately approves the PR
- **Auto-merge:** Enables auto-merge (squash commit)
- **Comments:** Adds status comment explaining next steps

## GitHub Settings Required

### 1. Branch Protection Rules

Ensure branch protection is enabled for `master`:

**Go to:** Settings → Branches → Edit rule for `master`

**Required settings:**

- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
  - Select: `test` (required)
  - Select: `security` (required)
  - Select: `deploy-dev` (required)
- ✅ **Require branches to be up to date before merging**
- ✅ **Allow auto-merge** (CRITICAL for auto-merge to work)

**Optional settings:**

- ❌ Uncheck "Require approvals" (Dependabot already auto-approves)
  - OR set to 1 approval (auto-approve workflow provides this)

### 2. GitHub Actions Permissions

**Go to:** Settings → Actions → General → Workflow permissions

**Required settings:**

- ✅ **Read and write permissions**
- ✅ **Allow GitHub Actions to create and approve pull requests**

Without these permissions, the auto-approve and auto-merge steps will fail.

### 3. Personal Access Token (PAT) for GitHub Actions Updates

**Why needed:** GitHub's `GITHUB_TOKEN` cannot merge PRs that modify workflow files (security restriction). Dependabot updates to GitHub Actions require a PAT.

**Create a PAT:**

1. Go to **GitHub Settings** (your profile, not repository) → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Name: `Dependabot Auto-Merge`
4. Expiration: `No expiration` (or set reminder to rotate)
5. Select scopes:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (Update GitHub Action workflows)
6. Click **Generate token**
7. Copy the token (you won't see it again!)

**Add PAT to repository:**

1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `PAT_TOKEN`
4. Value: Paste the token you copied
5. Click **Add secret**

**Result:** Dependabot can now auto-merge ALL updates, including GitHub Actions.

**Without PAT:** npm package updates will auto-merge, but GitHub Actions updates will require manual merge (workflow will leave a comment explaining this).

### 3. Enable Dependabot Alerts (Optional)

**Go to:** Settings → Security & analysis

Enable:

- ✅ **Dependabot alerts**
- ✅ **Dependabot security updates** (auto-creates PRs for security vulnerabilities)

## How It Works

### 1. Dependabot Creates PR

- Runs every Monday at 9 AM PT
- Groups minor/patch updates together
- Creates PR with detailed changelog
- Adds `dependencies` label

### 2. Auto-Approve Workflow Runs

- Detects PR is from `dependabot[bot]`
- Automatically approves the PR using GitHub token
- Leaves comment explaining next steps

### 3. CI Workflow Runs

- Tests must pass
- Security scan must complete
- Dev deployment must succeed
- If ANY check fails, auto-merge will NOT happen

### 4. Auto-Merge Triggers

- Only runs after CI completes successfully
- Uses GitHub's native auto-merge feature
- Squashes commits into single commit
- Merges to master

### 5. QA Deployment Triggers

- Automatically runs on merge to master
- Uses `deploy-qa.yml` workflow
- No manual intervention needed

### 6. Production Deployment

- Still requires manual trigger
- Gives you control over production releases
- Run from Actions tab when QA is verified

## Monitoring Dependabot

### View Dependabot PRs

```bash
# List all open Dependabot PRs
gh pr list --author "dependabot[bot]"

# View specific PR
gh pr view <PR_NUMBER>
```

### Check Auto-Merge Status

```bash
# Check if auto-merge is enabled on a PR
gh pr view <PR_NUMBER> --json autoMergeRequest

# Disable auto-merge if needed
gh pr merge --disable-auto <PR_NUMBER>
```

### View Dependabot Alerts

**Go to:** Security → Dependabot alerts

Shows:

- Vulnerable dependencies
- Severity level
- Suggested updates
- Auto-created PRs

## Manual Intervention Scenarios

### When to Manually Review

**1. Major version updates:**

- Check changelog for breaking changes
- Update code if API changes
- Run tests locally before merging

**2. Failed CI checks:**

- Review test failures
- Check if update introduced regression
- May need code changes to fix compatibility

**3. Security vulnerabilities:**

- Review severity and impact
- Test thoroughly in dev environment
- May want faster merge path for critical fixes

**4. GitHub Actions updates without PAT_TOKEN:**

- If `PAT_TOKEN` secret is not configured
- Auto-approve will work, but auto-merge will fail
- Workflow will leave a comment explaining the limitation
- Simply merge manually after CI passes

### How to Manually Merge

```bash
# Approve and merge from command line
gh pr review --approve <PR_NUMBER>
gh pr merge --squash <PR_NUMBER>

# Or use GitHub UI
# Go to PR → Review changes → Approve → Squash and merge
```

## Disabling Auto-Merge

If you want to disable auto-merge for specific updates:

### Option 1: Close Dependabot PR

```bash
# Close PR (Dependabot will stop creating updates for this dependency)
gh pr close <PR_NUMBER>

# Add comment to explain why
gh pr comment <PR_NUMBER> --body "Skipping this update due to [reason]"
```

### Option 2: Ignore Dependency Updates

Edit `.github/dependabot.yml`:

```yaml
ignore:
  - dependency-name: 'package-name'
    versions: ['>=2.0.0'] # Ignore all 2.x versions
```

### Option 3: Disable Auto-Merge Workflow

Temporarily disable by adding to workflow file:

```yaml
# Add to dependabot-auto-merge.yml
if: false # Disables the entire workflow
```

## Troubleshooting

### Auto-merge not working

**Check:**

1. Branch protection has "Allow auto-merge" enabled
2. All required checks are passing
3. GitHub Actions has write permissions
4. Workflow logs for errors
5. If PR touches workflows, check if `PAT_TOKEN` secret is configured

**Common causes:**

- **"refusing to allow a GitHub App to create or update workflow"** - This PR modifies workflow files and needs `PAT_TOKEN` secret. See "Personal Access Token" setup above.
- **Branch protection not configured** - Enable "Allow auto-merge" in branch protection rules
- **CI checks failing** - Auto-merge waits for all required checks to pass

**Fix:**

```bash
# Re-enable auto-merge manually
gh pr merge --auto --squash <PR_NUMBER>

# Or if PAT issue, merge directly after CI passes
gh pr merge --squash <PR_NUMBER>
```

### Dependabot PRs not being created

**Check:**

1. Dependabot is enabled in repository settings
2. `.github/dependabot.yml` syntax is valid
3. Check Dependabot logs: Settings → Insights → Dependency graph → Dependabot

### CI failing on Dependabot PRs

**Common causes:**

- Breaking changes in dependency
- TypeScript type incompatibilities
- Test expectations need updating

**Fix:**

1. Review the dependency changelog
2. Update code to handle changes
3. Push fixes to Dependabot branch:
   ```bash
   gh pr checkout <PR_NUMBER>
   # Make changes
   git commit -am "Fix compatibility with updated dependency"
   git push
   ```

### Too many Dependabot PRs

**Reduce PR volume:**
Edit `.github/dependabot.yml`:

```yaml
open-pull-requests-limit: 5 # Reduce from 10
schedule:
  interval: 'monthly' # Change from weekly
```

## Best Practices

1. **Monitor Slack notifications** - Get notified of all deployments
2. **Review QA after Dependabot merges** - Ensure updates didn't break functionality
3. **Keep major updates manual** - Breaking changes need human review
4. **Check Dependabot alerts weekly** - Even if PRs auto-merge, review what changed
5. **Test production after dependency updates** - Extra verification for critical apps

## Cost Impact

**Minimal AWS costs:**

- Dev deployments happen on every PR (including Dependabot)
- QA deployments happen on merge to master
- Lambda is pay-per-request, so idle deployments cost nothing
- Estimated cost increase: < $0.10/month

**GitHub Actions minutes:**

- Free tier: 2,000 minutes/month
- Each Dependabot PR: ~5-10 minutes (CI + deploy-dev)
- Expected weekly usage: ~10-20 minutes
- Well within free tier limits

## Related Documentation

- [CI/CD Pipeline](CI-CD.md) - Complete CI/CD workflow
- [GitHub Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
- [GitHub Auto-Merge Docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
