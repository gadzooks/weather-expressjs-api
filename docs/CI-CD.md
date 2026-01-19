# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment workflows for the Weather REST API project.

## Overview

**Simple 3-Rule CI/CD Pipeline:**

1. **Pull Request → Dev**: On commit to PR, automatically deploy to dev. Dev deployment must succeed before PR can be merged to master.
2. **Master → QA**: On merge to master, automatically deploy to QA.
3. **QA → Prod**: After QA succeeds, manually trigger production deployment anytime from GitHub Actions UI.

### Environments

- **Dev** (`weather-expressjs-dev`): Testing environment for PRs
- **QA** (`weather-expressjs-qa`): Staging environment, auto-deployed from master
- **Prod** (`weather-expressjs-prod`): Production environment, manually triggered

---

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- On pull request to `master` or `main` branches

**Purpose:** Run tests and deploy to dev environment

**Jobs:**

#### `test` (Required Check)
1. Checkout code
2. Setup Node.js 24
3. Install dependencies
4. Run ESLint
5. Build the project
6. Run all tests with coverage

#### `security` (Informational)
1. Run `yarn audit` for dependency vulnerabilities
2. Run Trivy security scanner

Both security checks use `continue-on-error: true` - they report issues but don't block PRs.

#### `deploy-dev` (Required Check)
Runs after `test` job passes.

1. Build the project
2. Deploy to dev environment using SAM
3. Run smoke tests
4. Comment on PR with deployment status and API URL

**Branch Protection:** Both `test` and `deploy-dev` should be marked as required checks to prevent merging failed PRs.

---

### 2. QA Deployment (`.github/workflows/deploy-qa.yml`)

**Triggers:**
- On push to `master` or `main` branches (after PR merge)
- Manual trigger via `workflow_dispatch` (for testing)

**Purpose:** Automatically deploy to QA after code is merged to master

**Steps:**
1. Checkout code
2. Setup Node.js and install dependencies
3. Build the project
4. Deploy to QA environment using SAM
5. Run smoke tests

**Environment:** `weather-expressjs-qa` Lambda function with 12-hour cache TTL

---

### 3. Production Deployment (`.github/workflows/deploy-prod.yml`)

**Triggers:**
- Manual trigger only via GitHub Actions UI

**Purpose:** Deploy to production with manual approval gate

**Steps:**
1. Checkout code from the current branch (typically master)
2. Setup Node.js and install dependencies
3. Build the project
4. Deploy to production environment using SAM
5. Run smoke tests
6. Optionally create a GitHub release

**Environment:** `weather-expressjs-prod` Lambda function (requires manual approval via GitHub Environment protection rules)

**How to deploy to production:**

1. Ensure QA deployment succeeded and is tested
2. Go to GitHub **Actions** tab
3. Click **"Deploy to Production"** in the left sidebar
4. Click **"Run workflow"** button (top right)
5. Select branch: **master** (or other branch if needed)
6. Choose whether to create a GitHub release (yes/no)
7. Click **"Run workflow"**
8. A reviewer must approve the deployment in the Actions UI
9. After approval, deployment proceeds automatically

---

## Setup Instructions

### 1. Configure GitHub Secrets

Navigate to your repository's **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key |
| `VC_API_KEY` | Visual Crossing API key |

**Required IAM Permissions:**
- `AWSCloudFormationFullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `IAMFullAccess`
- S3 Full Access (for `gadzooks-sam-artifacts` bucket)

---

### 2. Create Production Environment with Manual Approval

To enable the manual approval gate for production:

1. Go to **Settings → Environments**
2. Click **New environment**, name it: `production`
3. Under **Environment protection rules**, check **Required reviewers**
4. Add yourself or team members as required reviewers
5. Click **Save protection rules**

**Result:** Production deployments will pause and wait for manual approval.

---

### 3. Enable Branch Protection (Make CI Required)

To ensure PRs pass tests and deploy to dev before merging:

1. Go to **Settings → Branches**
2. Click **Add branch protection rule** (or edit existing rule for `master`)
3. Branch name pattern: `master` (or `main`)
4. Check:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - Select **`test`** status check (REQUIRED)
   - Select **`deploy-dev`** status check (REQUIRED)
   - ✅ **Require branches to be up to date before merging**
5. **Optional:** Uncheck **"Require approvals"** if you want to merge PRs without code review
6. Click **Save changes**

**Result:** PRs cannot be merged unless tests pass and dev deployment succeeds. Code reviews are optional.

**To Remove Code Review Requirement:**
If your branch protection currently requires approvals:
1. Go to **Settings → Branches** → Edit the `master` branch rule
2. Uncheck **"Require approvals"** (or set "Required number of approvals" to 0)
3. Click **Save changes**

This allows you to merge your own PRs after CI passes without needing another reviewer.

---

## Workflow Diagram

```
┌─────────────────────┐
│  Pull Request       │
│  (feature branch)   │
└──────────┬──────────┘
           │
           ▼
     ┌─────────────┐
     │  CI Tests   │ ← Required Check
     │  - Lint     │
     │  - Build    │
     │  - Tests    │
     └──────┬──────┘
            │
            ▼
     ┌──────────────┐
     │  Deploy Dev  │ ← Required Check
     │  - Deploy    │
     │  - Smoke Test│
     └──────┬───────┘
            │
            │ (Both Must Pass)
            │
            ▼
      ┌─────────────┐
      │ Merge to    │
      │  Master     │
      └──────┬──────┘
             │
             │ (Automatic)
             │
             ▼
       ┌──────────────┐
       │  Deploy QA   │
       │  (Automatic) │
       │  - Deploy    │
       │  - Smoke Test│
       └──────┬───────┘
              │
              │ (Test QA thoroughly)
              │
              ▼
        ┌────────────────┐
        │  Manual Trigger│
        │  from Actions  │
        │      UI        │
        └───────┬────────┘
                │
                ▼
          ┌──────────────┐
          │ Deploy Prod  │
          │              │
          │ ⏸  REQUIRES  │
          │   APPROVAL   │
          │              │
          │ - Deploy     │
          │ - Smoke Test │
          └──────────────┘
```

---

## Quick Reference

### Development Flow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "Add my feature"

# 3. Push and create PR
git push origin feature/my-feature
# Create PR on GitHub

# 4. Wait for CI and dev deployment to pass (required checks)

# 5. Merge PR to master
# → QA deployment triggers automatically

# 6. Test QA environment thoroughly

# 7. Deploy to production
# Go to Actions tab → Deploy to Production → Run workflow
```

---

## Environment URLs

After deployment, your API will be available at:

- **Dev:** `https://[dev-api-id].execute-api.us-west-1.amazonaws.com/Prod/`
- **QA:** `https://[qa-api-id].execute-api.us-west-1.amazonaws.com/Prod/`
- **Prod:** `https://[prod-api-id].execute-api.us-west-1.amazonaws.com/Prod/`

Find URLs in:
- AWS Console: API Gateway → Stages → Prod
- CloudFormation Outputs
- GitHub Actions workflow logs

---

## Manual Deployment (Command Line)

You can deploy directly from your local machine using the AWS SAM CLI, bypassing the GitHub Actions CI/CD pipeline entirely. This is useful for:
- Quick testing
- Emergency hotfixes
- Deploying from a local branch
- Troubleshooting deployment issues

### Prerequisites

1. **AWS SAM CLI installed:** `brew install aws-sam-cli`
2. **AWS credentials configured:**
   ```bash
   aws configure --profile claudia
   # Enter AWS Access Key ID, Secret Access Key, region: us-west-1
   ```
3. **Environment variables in `.env` file:**
   ```bash
   VC_API_KEY=your-visual-crossing-api-key
   ```

### Deploy to Dev

```bash
# Build and deploy to dev environment
yarn sam:deploy:dev
```

**What this does:**
- Builds TypeScript → JavaScript (dist/)
- Runs SAM build (packages Lambda function)
- Deploys to `weather-expressjs-dev` stack
- Uses 24-hour cache TTL
- Sets ALLOWED_ORIGINS for dev and localhost

**Equivalent full command:**
```bash
sam build && sam deploy --region us-west-1 \
  --config-env dev \
  --parameter-overrides "EnvironmentType=dev VisualCrossingApiKey=$VC_API_KEY AllowedOrigins='https://dev-weather-react.onrender.com,http://localhost:3000,http://localhost:5173,http://localhost:5174'" \
  --profile claudia
```

### Deploy to QA

```bash
# Build and deploy to QA environment
yarn sam:deploy:qa
```

**What this does:**
- Builds TypeScript → JavaScript (dist/)
- Runs SAM build (packages Lambda function)
- Deploys to `weather-expressjs-qa` stack
- Uses 12-hour cache TTL
- Sets ALLOWED_ORIGINS for QA frontend

**Equivalent full command:**
```bash
sam build && sam deploy --region us-west-1 \
  --config-env qa \
  --parameter-overrides "EnvironmentType=qa VisualCrossingApiKey=$VC_API_KEY AllowedOrigins='https://qa-weather-react.onrender.com'" \
  --profile claudia
```

### Deploy to Production

```bash
# Build and deploy to production environment
yarn sam:deploy
```

**What this does:**
- Builds TypeScript → JavaScript (dist/)
- Runs SAM build (packages Lambda function)
- Deploys to `weather-expressjs-prod` stack
- Uses 3-hour cache TTL
- Sets ALLOWED_ORIGINS for production domain

**Equivalent full command:**
```bash
sam build && sam deploy --region us-west-1 \
  --config-env prod \
  --parameter-overrides "EnvironmentType=prod VisualCrossingApiKey=$VC_API_KEY AllowedOrigins='https://weather.weekendwanderings.com'" \
  --profile claudia
```

### Verify Deployment

After manual deployment, check the deployment:

```bash
# Get API URL from CloudFormation stack outputs
aws cloudformation describe-stacks \
  --stack-name weather-expressjs-dev \
  --region us-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WeatherApiUrl`].OutputValue' \
  --output text \
  --profile claudia

# Test the endpoint
curl https://[api-url]/forecasts/mock | jq '.data.locations.allIds | length'
```

### Troubleshooting Manual Deployments

**"No such file or directory: '.aws-sam'"**
```bash
# Clean and rebuild
rm -rf .aws-sam dist/
yarn build
sam build
sam deploy --config-env dev --profile claudia
```

**"Parameter validation failed: Unknown parameter"**
- Ensure you're using the correct `--config-env` flag (dev, qa, or prod)
- Check that `samconfig.toml` contains the environment configuration

**"Unable to upload artifact ... Access Denied"**
- Verify AWS credentials: `aws s3 ls --profile claudia`
- Check IAM permissions include S3 full access
- Ensure S3 bucket exists: `aws s3 ls s3://gadzooks-sam-artifacts --profile claudia`

---

## Troubleshooting

### QA deployment not triggering after merge to master

**Check:**
1. Go to GitHub **Actions** tab, look for "Deploy to QA" workflow run
2. Check if it's pending approval (Settings → Environments → qa)
3. Remove "Required reviewers" from qa environment if you want automatic deployment
4. Verify GitHub Actions are enabled (Settings → Actions → General)

### Production deployment button not visible

**Fix:**
- Ensure you've pushed the updated `deploy-prod.yml` workflow file
- Wait a few moments for GitHub to recognize the workflow
- Refresh the Actions page

### Deployment succeeds but API returns errors

**Debug:**
1. Check CloudWatch Logs in AWS Console
2. Verify `VC_API_KEY` is set correctly in GitHub Secrets
3. Check SAM template parameters

### Tests pass locally but fail in CI

**Check:**
1. Environment variables (see `jest.config.js` setup)
2. Node.js version compatibility
3. Review GitHub Actions logs for details

---

## Environment Configuration

### Cache TTL by Environment

Forecast cache duration is configured per environment:

- **Dev**: 24 hours (reduces API calls during development)
- **QA**: 12 hours (extended cache for testing)
- **Prod**: 3 hours (fresher data for production)

Set via `CACHE_TTL_HOURS` environment variable in `template.yaml` and deployment scripts.

---

## Best Practices

1. **Always create a PR** - Never push directly to master
2. **Wait for required checks** - Both `test` and `deploy-dev` must pass
3. **Test in dev** - Verify changes work in the dev deployment
4. **Review QA** - After merge, thoroughly test the QA environment
5. **Manual prod trigger** - Only deploy to prod after QA is verified
6. **Monitor deployments** - Watch CloudWatch logs after production deployments
7. **Document changes** - Add clear PR descriptions

---

## Workflow Files

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - CI testing and dev deployment
- [`.github/workflows/deploy-qa.yml`](../.github/workflows/deploy-qa.yml) - QA deployment
- [`.github/workflows/deploy-prod.yml`](../.github/workflows/deploy-prod.yml) - Production deployment

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and manual deployment
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
