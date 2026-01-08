# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment workflows for the Weather REST API project.

## Overview

The project uses GitHub Actions for automated testing and deployment across three environments:
- **Dev**: Deployed automatically on every pull request
- **QA**: Deployed automatically on merge to master
- **Prod**: Deployed manually after QA deployment (requires approval)

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- On pull request to `master` or `main` branches
- On push to `master` or `main` branches

**Purpose:** Validates code quality and ensures tests pass before deployment

**Steps:**
1. Checkout code
2. Setup Node.js 24
3. Install dependencies (`npm ci`)
4. Run ESLint (`npm run lint`)
5. Run tests (`npm test`)
6. Run tests with coverage (`npm run test:coverage`)
7. Build the project (`npm run build`)

**Status:** This workflow should be marked as **required** in branch protection rules to prevent merging PRs with failing tests.

---

### 2. PR Deployment (`.github/workflows/deploy-pr.yml`)

**Triggers:**
- On pull request opened, synchronized, or reopened

**Purpose:** Automatically deploy PR changes to the dev environment for testing

**Steps:**
1. Checkout code
2. Setup Node.js 24
3. Install dependencies
4. Build the project
5. Setup AWS SAM CLI
6. Configure AWS credentials
7. Deploy to dev environment using SAM
8. Comment on PR with deployment status (success/failure)

**Environment:** `weather-expressjs-dev` Lambda function

---

### 3. Master Deployment (`.github/workflows/deploy-master.yml`)

**Triggers:**
- On push to `master` or `main` branches (after PR merge)

**Purpose:** Deploy to QA automatically, then to production with manual approval

**Jobs:**

#### Job 1: `deploy-qa`
Runs automatically after merge to master.

**Steps:**
1. Checkout code
2. Setup Node.js 24
3. Install dependencies
4. Build the project
5. Setup AWS SAM CLI
6. Configure AWS credentials
7. Deploy to QA environment using SAM

**Environment:** `weather-expressjs-qa` Lambda function

#### Job 2: `deploy-prod`
Runs after `deploy-qa` completes successfully, but requires manual approval.

**Steps:**
1. Checkout code
2. Setup Node.js 24
3. Install dependencies
4. Build the project
5. Setup AWS SAM CLI
6. Configure AWS credentials
7. Deploy to production environment using SAM

**Environment:** `weather-expressjs-prod` Lambda function (requires approval)

---

## Setup Instructions

### 1. Configure GitHub Secrets

Navigate to your repository's **Settings → Secrets and variables → Actions** and add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtn...` |
| `VC_API_KEY` | Visual Crossing API key | `YOUR_VC_KEY` |

**Important:** The AWS credentials should have the following IAM permissions:
- `AWSCloudFormationFullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `IAMFullAccess`
- S3 permissions for `aws-sam-cli-managed-*` buckets

---

### 2. Create Production Environment with Manual Approval

To enable the manual approval gate for production deployments:

1. Go to **Settings → Environments**
2. Click **New environment**
3. Name it: `production`
4. Under **Environment protection rules**, check **Required reviewers**
5. Add yourself or team members as required reviewers
6. (Optional) Set **Wait timer** if you want a delay before deployment can be approved
7. Click **Save protection rules**

**Result:** When the master workflow reaches the `deploy-prod` job, it will pause and wait for a reviewer to approve the deployment in the GitHub Actions UI.

---

### 3. Enable Branch Protection (Make CI Required)

To ensure all PRs pass tests before merging:

1. Go to **Settings → Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `master` (or `main`)
4. Check the following options:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - Select the `test` status check (from the CI workflow)
   - ✅ **Require branches to be up to date before merging**
5. Click **Create** or **Save changes**

**Result:** PRs cannot be merged unless the CI workflow's `test` job passes.

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Pull Request Created                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ├─────────────────────────────┐
                        │                             │
                        ▼                             ▼
              ┌─────────────────┐         ┌──────────────────┐
              │   CI Workflow   │         │  Deploy to Dev   │
              │                 │         │    (PR Deploy)   │
              │ - Lint          │         │                  │
              │ - Test          │         │ Auto-deploys to  │
              │ - Coverage      │         │ dev environment  │
              │ - Build         │         │                  │
              └─────────────────┘         └──────────────────┘
                        │
                        │ (Must Pass - Required)
                        │
                        ▼
              ┌─────────────────┐
              │   Merge to      │
              │     Master      │
              └────────┬────────┘
                       │
                       ├─────────────────────────────┐
                       │                             │
                       ▼                             ▼
             ┌─────────────────┐         ┌──────────────────┐
             │   CI Workflow   │         │  Deploy to QA    │
             │                 │         │   (Automatic)    │
             │ - Lint          │         │                  │
             │ - Test          │         └────────┬─────────┘
             │ - Coverage      │                  │
             │ - Build         │                  │
             └─────────────────┘                  ▼
                                        ┌──────────────────┐
                                        │  Deploy to Prod  │
                                        │                  │
                                        │ ⏸ REQUIRES      │
                                        │ MANUAL APPROVAL  │
                                        │                  │
                                        └──────────────────┘
```

---

## Environment URLs

After deployment, your API will be available at:

- **Dev:** `https://[dev-api-id].execute-api.us-west-1.amazonaws.com/Prod/`
- **QA:** `https://[qa-api-id].execute-api.us-west-1.amazonaws.com/Prod/`
- **Prod:** `https://[prod-api-id].execute-api.us-west-1.amazonaws.com/Prod/`

You can find the API Gateway URLs in:
- AWS Console: API Gateway → [Environment Name] → Stages → Prod
- CloudFormation Outputs after deployment
- GitHub Actions workflow logs

---

## Manual Deployment

If you need to deploy manually (bypassing the CI/CD pipeline):

```bash
# Deploy to dev
yarn sam:deploy:dev

# Deploy to QA
yarn sam:deploy:qa

# Deploy to production
yarn sam:deploy
```

See [CLAUDE.md](../CLAUDE.md) for more details on manual deployment commands.

---

## Approving Production Deployments

When a merge to master triggers the deployment workflow:

1. The QA deployment will run automatically
2. The production deployment job will start but pause, waiting for approval
3. You'll receive a notification (if configured)
4. Go to **Actions** tab → Click the running workflow → Click **Review deployments**
5. Select **production** environment
6. Add a comment (optional) and click **Approve and deploy**

The production deployment will then proceed.

---

## Troubleshooting

### Workflow fails with AWS credentials error
- Verify that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correctly set in GitHub Secrets
- Check that the IAM user has the required permissions

### Tests fail in CI but pass locally
- Ensure environment variables are correctly set (check `jest.config.js` setup)
- Check for timezone or environment-specific issues
- Review the GitHub Actions logs for detailed error messages

### Deployment succeeds but API returns errors
- Check CloudWatch Logs in AWS Console
- Verify that `VC_API_KEY` is correctly set in GitHub Secrets
- Check SAM template parameter overrides

### Manual approval not working
- Ensure the `production` environment is created in repository settings
- Verify that you're added as a required reviewer
- Check that the workflow references `environment: production`

---

## Best Practices

1. **Always create a PR** - Never push directly to master
2. **Wait for CI to pass** - Don't merge failing PRs
3. **Test in dev** - Verify your changes work in the dev deployment before merging
4. **Review QA deployment** - Check the QA environment before approving production
5. **Monitor deployments** - Watch CloudWatch logs after production deployments
6. **Use semantic commit messages** - Helps track changes in deployment history

---

## Workflow Files

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - CI testing workflow
- [`.github/workflows/deploy-pr.yml`](../.github/workflows/deploy-pr.yml) - PR dev deployment
- [`.github/workflows/deploy-master.yml`](../.github/workflows/deploy-master.yml) - QA/Prod deployment

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and deployment details
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
