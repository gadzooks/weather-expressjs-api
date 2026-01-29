# CI/CD Enhancement Testing Checklist

Use this checklist to verify that all Slack notification and deployment tracking features are working correctly.

## Prerequisites

- [ ] All new files committed to repository
- [ ] GitHub Actions workflows are enabled
- [ ] AWS credentials configured in GitHub secrets

## Phase 1: GitHub-Only Testing (No Slack Required)

### Test 1: Dev Deployment Summary

- [ ] Create a new branch: `git checkout -b test/slack-notifications`
- [ ] Make a small change (e.g., add a comment to README.md)
- [ ] Push branch and create a PR on GitHub
- [ ] Wait for CI workflow to complete
- [ ] **Verify:** Check the commit on GitHub for a deployment summary comment
  - Should include: ✅ or ❌, environment emoji 🔧, status, API URL

### Test 2: QA Deployment Summary

- [ ] Merge the test PR to master
- [ ] Wait for QA deployment to complete
- [ ] **Verify:** Check the merge commit on GitHub for a deployment summary comment
  - Should include: environment emoji 🧪, status, API URL

### Test 3: Production Diff Generation

- [ ] Go to Actions tab → "Deploy to Production"
- [ ] Click "Run workflow"
- [ ] Select branch: master
- [ ] Create release: no (for testing)
- [ ] Click "Run workflow" button
- [ ] Wait for workflow to start
- [ ] **Verify in workflow logs:**
  - [ ] "Get Last Production Deployment" step shows SHA or "no deployment found"
  - [ ] "Generate Production Diff" step shows commit count and files (if previous deployment exists)
  - [ ] "Display Diff Summary" step shows notice with summary
- [ ] **Verify on GitHub:**
  - [ ] Check the commit for a deployment summary comment
  - [ ] Comment includes production diff (if previous deployment exists)

### Test 4: Production Release with Diff

- [ ] Trigger production deployment again
- [ ] This time, set "Create release" to "yes"
- [ ] Wait for deployment to complete
- [ ] **Verify:**
  - [ ] Go to Releases tab
  - [ ] Latest release includes deployment diff in release notes
  - [ ] Diff shows commit messages and file changes

### Test 5: Weekly Reminder

- [ ] Go to Actions → "Production Deployment Reminder"
- [ ] Click "Run workflow" → "Run workflow"
- [ ] Wait for workflow to complete
- [ ] **If last prod deployment < 7 days ago:**
  - [ ] Workflow should complete with "no reminder needed" message
  - [ ] No issue should be created
- [ ] **If last prod deployment ≥ 7 days ago OR no deployment found:**
  - [ ] Check Issues tab for new issue
  - [ ] Issue title: "⏰ Production Deployment Overdue (X days)"
  - [ ] Issue includes last deployment info and action items
  - [ ] Issue has labels: "deployment-reminder", "production"

### Test 6: Failure Scenarios

- [ ] Create a PR that intentionally breaks tests
- [ ] **Verify:** Dev deployment fails and comment shows ❌ status
- [ ] Fix the tests and push again
- [ ] **Verify:** New deployment succeeds and comment shows ✅ status

---

## Phase 2: Slack Integration Setup

### Step 1: Install GitHub Slack App

- [ ] Go to https://slack.com/apps/A01BP7R4KNY-github
- [ ] Click "Add to Slack"
- [ ] Select your workspace
- [ ] Authorize the app with requested permissions
- [ ] **Verify:** GitHub app appears in Apps section of Slack

### Step 2: Configure Slack Channel

- [ ] Choose a channel for notifications (e.g., #deployments, #github)
- [ ] In the channel, run: `/invite @github`
- [ ] **Verify:** GitHub bot joins the channel

### Step 3: Subscribe to Repository Events

- [ ] In the Slack channel, run:
  ```
  /github subscribe gadzooks/weather-expressjs workflows issues
  ```
- [ ] **Verify:** Slack shows subscription confirmation message

### Step 4: Verify Subscription

- [ ] In the Slack channel, run: `/github subscribe list`
- [ ] **Verify:** Output shows:
  ```
  gadzooks/weather-expressjs
    workflows, issues
  ```

---

## Phase 3: End-to-End Slack Testing

### Test 7: Dev Deployment Notification in Slack

- [ ] Create a new PR (or update existing one)
- [ ] Push a commit to trigger CI
- [ ] **Verify in Slack:**
  - [ ] Message appears when workflow starts
  - [ ] Message thread updates when workflow completes
  - [ ] Commit comment with deployment summary appears
  - [ ] Includes: 🔧 Dev emoji, ✅ or ❌ status, API URL

### Test 8: QA Deployment Notification in Slack

- [ ] Merge a PR to master
- [ ] **Verify in Slack:**
  - [ ] "Deploy to QA" workflow notification appears
  - [ ] Commit comment with deployment summary appears
  - [ ] Includes: 🧪 QA emoji, status, API URL

### Test 9: Production Deployment with Diff in Slack

- [ ] Trigger production deployment from Actions tab
- [ ] **Verify in Slack:**
  - [ ] "Deploy to Production" workflow notification appears
  - [ ] Commit comment includes:
    - [ ] 🚀 Production emoji
    - [ ] Deployment status
    - [ ] API URL
    - [ ] Production diff section (if previous deployment exists)
    - [ ] Commit count and messages
    - [ ] File change statistics

### Test 10: Weekly Reminder in Slack

**Option A: If prod is already 7+ days old**
- [ ] Wait for next Monday 9 AM UTC
- [ ] **Verify in Slack:**
  - [ ] Issue notification appears
  - [ ] Title shows days overdue
  - [ ] Includes link to trigger deployment

**Option B: Manual trigger for immediate testing**
- [ ] Go to Actions → "Production Deployment Reminder"
- [ ] Click "Run workflow" → "Run workflow"
- [ ] **Verify in Slack:**
  - [ ] Issue notification appears (if threshold met)
  - [ ] Content matches GitHub issue

### Test 11: Notification Threading

- [ ] Trigger any deployment (dev, qa, or prod)
- [ ] **Verify in Slack:**
  - [ ] Initial message appears when workflow starts
  - [ ] Deployment summary appears as a reply in the thread
  - [ ] Thread is easy to follow
  - [ ] Links to GitHub workflow run work correctly

---

## Phase 4: Fine-Tuning (Optional)

### Reduce Notification Volume

If you receive too many notifications, try filtering:

- [ ] Unsubscribe from all workflows:
  ```
  /github unsubscribe gadzooks/weather-expressjs workflows
  ```

- [ ] Subscribe only to manual triggers (production):
  ```
  /github subscribe gadzooks/weather-expressjs workflows:{event:"workflow_dispatch"}
  ```

- [ ] Subscribe only to master branch events:
  ```
  /github subscribe gadzooks/weather-expressjs workflows:{branch:"master"}
  ```

### Test Filters

- [ ] Apply desired filters
- [ ] Trigger various workflows
- [ ] **Verify:** Only expected notifications appear in Slack

---

## Common Issues

### Issue: No Slack notifications appearing

**Check:**
- [ ] GitHub bot is in the channel: `/invite @github`
- [ ] Subscription is active: `/github subscribe list`
- [ ] GitHub Actions workflow completed (check Actions tab)

**Fix:**
- Re-subscribe: `/github subscribe gadzooks/weather-expressjs workflows issues`

### Issue: Diff not showing in production deployment

**Check:**
- [ ] Is this the first production deployment? (No previous deployment to diff against)
- [ ] Did "Get Last Production Deployment" step run successfully?
- [ ] Check workflow logs for errors

**Fix:**
- Deploy to production once to establish baseline
- Ensure workflows use `environment: production`

### Issue: Weekly reminder not triggering

**Check:**
- [ ] Cron schedule enabled? (GitHub disables after 60 days repo inactivity)
- [ ] Last production deployment actually ≥ 7 days old?

**Fix:**
- Manually trigger workflow to test: Actions → "Production Deployment Reminder" → Run workflow
- Adjust threshold if needed (edit workflow file, line with `[ "$DAYS" -ge 7 ]`)

### Issue: Duplicate issues created

**Check:**
- [ ] Are multiple instances of the reminder workflow running?

**Fix:**
- Workflow should update existing issues, not create new ones
- Close duplicate issues manually
- Check workflow logic in `prod-deployment-reminder.yml`

---

## Success Criteria

All items below should be ✅ after testing:

- [ ] Dev deployments create commit comments (GitHub + Slack)
- [ ] QA deployments create commit comments (GitHub + Slack)
- [ ] Production deployments create commit comments (GitHub + Slack)
- [ ] Production diffs show commit messages and file changes
- [ ] Production diffs appear in both Slack and GitHub
- [ ] Production releases include deployment diff (when enabled)
- [ ] Weekly reminder creates issue if prod is 7+ days old
- [ ] Weekly reminder updates existing issue (doesn't spam)
- [ ] Slack notifications include correct emoji and formatting
- [ ] Failure scenarios show ❌ status in notifications
- [ ] All links in notifications work correctly

---

## Cleanup After Testing

- [ ] Delete test branches: `git branch -D test/slack-notifications`
- [ ] Close test issues on GitHub
- [ ] Archive test Slack messages (optional)
- [ ] Document any custom filters applied in team wiki/docs

---

## Next Steps

After successful testing:

1. **Share setup guide** with team: `docs/SLACK-SETUP.md`
2. **Update team documentation** with Slack channel name
3. **Set calendar reminder** to check cron schedule quarterly
4. **Monitor notification volume** for first week
5. **Adjust filters** based on team feedback

---

## Questions or Issues?

- Review: `docs/SLACK-SETUP.md`
- Review: `docs/CI-CD.md`
- Review: `IMPLEMENTATION-SUMMARY.md`
- Check GitHub Actions logs
- Open GitHub issue in repository
