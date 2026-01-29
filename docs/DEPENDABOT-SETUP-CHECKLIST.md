# Dependabot Auto-Merge Setup Checklist

Complete these steps to enable fully automated dependency updates.

## ✅ Step 1: Enable GitHub Settings (5 minutes)

### Branch Protection (CRITICAL)

Go to: **Settings → Branches → Edit rule for `master`**

- [ ] ✅ Require a pull request before merging
- [ ] ✅ Require status checks to pass before merging
  - [ ] Select: `test`
  - [ ] Select: `security`
  - [ ] Select: `deploy-dev`
- [ ] ✅ Require branches to be up to date before merging
- [ ] ✅ **Allow auto-merge** ← MOST IMPORTANT SETTING
- [ ] ❌ Uncheck "Require approvals" (optional, allows self-merge)

### GitHub Actions Permissions

Go to: **Settings → Actions → General → Workflow permissions**

- [ ] ✅ Read and write permissions
- [ ] ✅ Allow GitHub Actions to create and approve pull requests

### Enable Dependabot (Optional but Recommended)

Go to: **Settings → Security & analysis**

- [ ] ✅ Dependabot alerts
- [ ] ✅ Dependabot security updates

## ✅ Step 2: Create Personal Access Token (10 minutes)

**Why needed:** Auto-merge GitHub Actions updates (without this, only npm packages auto-merge)

### Create PAT

1. Go to **Your GitHub Profile** → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Settings:
   - **Name:** `Dependabot Auto-Merge`
   - **Expiration:** No expiration (or set reminder)
   - **Scopes:**
     - [ ] ✅ `repo` (Full control of private repositories)
     - [ ] ✅ `workflow` (Update GitHub Action workflows)
4. Click **Generate token**
5. **Copy the token** (you won't see it again!)

### Add PAT to Repository

1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `PAT_TOKEN`
4. Value: Paste the token
5. Click **Add secret**

**Result:** ✅ All dependency updates (npm + GitHub Actions) will auto-merge

**Skip this step:** ⚠️ npm packages will auto-merge, but GitHub Actions updates require manual merge (still automated approval, just manual click to merge)

## ✅ Step 3: Commit and Push Files (2 minutes)

```bash
# Stage the new files
git add .github/dependabot.yml
git add .github/workflows/dependabot-auto-merge.yml
git add docs/DEPENDABOT.md
git add docs/DEPENDABOT-SETUP-CHECKLIST.md
git add docs/CI-CD.md  # Updated with Dependabot reference
git add CLAUDE.md      # Updated with Dependabot reference

# Commit
git commit -m "Add Dependabot auto-merge configuration

- Configure Dependabot for weekly dependency scans
- Auto-approve and auto-merge minor/patch updates
- Trigger CI/CD pipeline automatically
- Deploy to dev, then auto-merge to master, then QA
- Add PAT support for GitHub Actions updates
- Add comprehensive documentation"

# Push to master (or create PR if you prefer)
git push origin master
```

## ✅ Step 4: Test the Setup (Optional)

### Option A: Wait for Monday 9 AM PT

Dependabot will automatically scan and create PRs.

### Option B: Test Immediately

1. Go to **Settings → Security & analysis**
2. Enable **Dependabot security updates** (if not already)
3. Go to **Security → Dependabot alerts**
4. If any vulnerabilities exist, Dependabot will create PRs immediately

### Option C: Manual Test with Dummy Update

```bash
# Temporarily update a package version in package.json to an older version
# Example: Change "express": "^4.21.2" to "express": "^4.20.0"

# Commit and push
git checkout -b test-dependabot
# Edit package.json
git add package.json
git commit -m "Test: Downgrade express for Dependabot test"
git push origin test-dependabot

# Create PR - this will NOT trigger Dependabot
# Dependabot only runs on schedule or for security vulnerabilities

# Clean up
git checkout master
git branch -D test-dependabot
```

**Better test:** Just wait for the first real Dependabot PR!

## ✅ Step 5: Monitor First Dependabot PR

When the first Dependabot PR is created, verify:

1. [ ] PR is auto-approved within seconds
2. [ ] CI workflow starts automatically
3. [ ] Tests pass
4. [ ] Dev deployment succeeds
5. [ ] PR auto-merges to master
6. [ ] QA deployment triggers automatically
7. [ ] Comment on PR explains next steps

**If auto-merge fails:**

- Check the PR comment for explanation
- Review workflow logs in Actions tab
- See troubleshooting in [DEPENDABOT.md](DEPENDABOT.md#troubleshooting)

## What Happens Next

### Weekly Dependency Updates

- **Every Monday at 9 AM PT:** Dependabot scans for updates
- **Minor/patch updates:** Grouped into single PR
- **Auto-approved:** Immediately
- **CI runs:** Tests, lint, security scan, dev deployment
- **Auto-merges:** When all checks pass (typically 5-10 minutes)
- **QA deploys:** Automatically after merge to master

### Major Version Updates

- **Created as separate PR**
- **Auto-approved but NOT auto-merged**
- **Requires your manual review and merge**
- Why? May contain breaking changes

### Security Updates

- **Created immediately when detected**
- **Auto-merged if minor/patch**
- **Manual review if major**

## Rollback Plan

If you want to disable Dependabot auto-merge:

```bash
# Option 1: Disable auto-merge workflow
# Edit .github/workflows/dependabot-auto-merge.yml
# Add: if: false

# Option 2: Remove the workflow entirely
rm .github/workflows/dependabot-auto-merge.yml
git commit -am "Disable Dependabot auto-merge"
git push

# Dependabot will still create PRs, but you merge manually
```

## Summary

| Feature                         | Status After Setup                  |
| ------------------------------- | ----------------------------------- |
| Dependabot PRs                  | ✅ Automated (weekly + security)    |
| Auto-approve PRs                | ✅ Instant                          |
| Run CI tests                    | ✅ Automatic                        |
| Deploy to dev                   | ✅ Automatic (after tests pass)     |
| Auto-merge to master            | ✅ Automatic (after dev succeeds)   |
| Deploy to QA                    | ✅ Automatic (after merge)          |
| Deploy to prod                  | ⏸️ Manual (as designed)             |
| GitHub Actions updates          | ✅ With PAT / ⚠️ Manual without PAT |
| Major version updates           | ⏸️ Manual review required           |
| Estimated time saved per week   | ~30-60 minutes                      |
| Human intervention per week     | 0-5 minutes (for major updates)     |
| Cost increase (AWS Lambda/S3)   | < $0.10/month                       |
| GitHub Actions minutes per week | ~10-20 minutes (well within free)   |

## Need Help?

- **Full documentation:** [DEPENDABOT.md](DEPENDABOT.md)
- **CI/CD pipeline:** [CI-CD.md](CI-CD.md)
- **GitHub issues:** Create an issue if something doesn't work

## Post-Setup Monitoring

After setup, monitor for first few weeks:

1. Check Slack for deployment notifications
2. Review QA after Dependabot merges
3. Verify no unexpected issues
4. Adjust `open-pull-requests-limit` if too many PRs
5. Customize schedule if weekly is too frequent

**Recommendation:** Keep it running for 2-3 weeks, then adjust based on your needs.
