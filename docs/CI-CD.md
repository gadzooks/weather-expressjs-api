# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment workflows for the Weather REST API project.

## Overview

The project uses GitHub Actions for automated testing and deployment across three environments:
- **Dev**: Deployed automatically on every pull request (required check - blocks merge if fails)
- **QA**: Deployed automatically on merge to master
- **Prod**: Deployed via semantic version tags (e.g., `v1.2.3`) with manual approval required

## Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically run linting and formatting on staged files before each commit.

**What happens on commit:**
- Husky triggers the pre-commit hook
- lint-staged runs ESLint and Prettier only on staged `.ts` files
- If linting fails, the commit is blocked
- If linting succeeds, the commit proceeds

**Configuration:**
- `.husky/pre-commit` - Husky hook that runs `yarn lint-staged`
- `.lintstagedrc.json` - Defines which commands run on staged files

**Benefits:**
- Catches linting errors early, before they reach CI
- Reduces CI failures and speeds up development
- Automatically formats code to match project standards
- Only checks files you're committing (fast feedback)

**Note:** Pre-commit hooks run locally. The CI workflow still runs full lint, build, and tests on all files to ensure nothing is missed.

---

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- On pull request to `master` or `main` branches
- On push to `master` or `main` branches

**Purpose:** Validates code quality, runs tests, and deploys to dev environment for PRs

**Jobs:**

#### Job 1: `test` (runs on all triggers)
1. Checkout code
2. Setup Node.js 24
3. Install dependencies (`yarn install --frozen-lockfile`)
4. Run ESLint (`yarn lint`)
5. Build the project (`yarn build`)
6. Run tests (`yarn test:all`)
7. Run tests with coverage (`yarn test:coverage`)

#### Job 2: `security` (runs in parallel with test)
1. Run security audit (`yarn audit`)
2. Run Trivy security scanner

Both security checks use `continue-on-error: true`, so they report issues but don't block PRs.

#### Job 3: `deploy-dev` (only runs on PRs, after tests pass)
1. Install dependencies and build
2. Setup AWS SAM CLI
3. Deploy to dev environment
4. Run smoke tests
5. Comment on PR with deployment status and API URL

**Status:** The `test` and `deploy-dev` jobs should be marked as **required** in branch protection rules to prevent merging PRs with failing tests or deployments.

#### Security Job (runs in parallel with tests)

The CI workflow includes a dedicated security job that runs the following checks:

1. **yarn audit** - Scans for known vulnerabilities in dependencies (moderate level and above)
2. **Trivy Scanner** - Comprehensive security scanner that checks for:
   - Vulnerable dependencies
   - Configuration issues
   - Exposed secrets
   - Critical and high severity issues

Both security checks use `continue-on-error: true`, meaning they will report issues but won't block PRs. This allows you to see security warnings while maintaining development velocity.

**ESLint Security Plugins:**
The lint step now includes:
- `eslint-plugin-security` - Detects common security anti-patterns
- `eslint-plugin-no-secrets` - Prevents accidental secret commits

---

### 2. QA Deployment (`.github/workflows/deploy-qa.yml`)

**Triggers:**
- On push to `master` or `main` branches (after PR merge)

**Purpose:** Automatically deploy to QA environment after code is merged to master

**Steps:**
1. Checkout code
2. Setup Node.js 24
3. Install dependencies
4. Build the project
5. Setup AWS SAM CLI
6. Configure AWS credentials
7. Deploy to QA environment using SAM
8. Run smoke tests

**Environment:** `weather-expressjs-qa` Lambda function

---

### 3. Production Deployment (`.github/workflows/deploy-prod.yml`)

**Triggers:**
- On push of semantic version tags (e.g., `v1.2.3`, `v2.0.0`)

**Purpose:** Deploy to production with manual approval gate

**Steps:**
1. Checkout tagged commit
2. Extract version from tag
3. Setup Node.js 24
4. Install dependencies
5. Build the project
6. Setup AWS SAM CLI
7. Configure AWS credentials
8. Deploy to production environment using SAM
9. Run smoke tests
10. Create GitHub release with deployment details

**Environment:** `weather-expressjs-prod` Lambda function (requires manual approval via GitHub Environment protection rules)

**How to deploy to production:**
```bash
# 1. Ensure your code is merged to master and QA deployment succeeded
# 2. Create and push a semantic version tag
git tag v1.2.3
git push origin v1.2.3

# 3. GitHub Actions will start the production deployment workflow
# 4. A reviewer must approve the deployment in the GitHub Actions UI
# 5. After approval, the deployment proceeds automatically
```

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
- S3 Full Access (for `gadzooks-sam-artifacts` bucket and `aws-sam-cli-managed-*` buckets)

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

### 3. Enable Branch Protection (Make CI and Dev Deployment Required)

To ensure all PRs pass tests and successfully deploy to dev before merging:

1. Go to **Settings → Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `master` (or `main`)
4. Check the following options:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - Select the **`test`** status check (from the CI workflow) - REQUIRED
   - Select the **`deploy-dev`** status check (from the CI workflow) - REQUIRED
   - Optionally select the **`security`** status check for additional security validation
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings** (to prevent merging failed PRs even by admins)
   - Alternatively: ✅ **Allow specified actors to bypass required pull requests** and add specific admin users who can override in emergency situations
5. Click **Create** or **Save changes**

**Result:** PRs cannot be merged unless:
- The `test` job passes (lint, build, all tests)
- The `deploy-dev` job passes (successful deployment to dev environment + smoke tests)

This ensures every merge to master has been tested in a real deployment environment.

**Note:** The `security` job runs `yarn audit` and Trivy scanner with `continue-on-error: true`, so it won't block PRs but will show warnings for security issues.

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Pull Request Created                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   CI Workflow   │
              │                 │
              │ ┌─────────────┐ │
              │ │    test     │ │  (Required Check)
              │ │ - Lint      │ │
              │ │ - Build     │ │
              │ │ - Tests     │ │
              │ └──────┬──────┘ │
              │        │        │
              │        ▼        │
              │ ┌─────────────┐ │
              │ │ deploy-dev  │ │  (Required Check)
              │ │ - Deploy    │ │
              │ │ - Smoke test│ │
              │ └─────────────┘ │
              └─────────────────┘
                        │
                        │ (Both Must Pass)
                        │
                        ▼
              ┌─────────────────┐
              │   Merge to      │
              │     Master      │
              └────────┬────────┘
                       │
                       │ (Automatic)
                       │
                       ▼
             ┌──────────────────┐
             │  Deploy to QA    │
             │   (Automatic)    │
             │                  │
             │ - Deploy         │
             │ - Smoke test     │
             └──────────────────┘
                       │
                       │ (Manual - when ready for prod)
                       │
                       ▼
             ┌──────────────────┐
             │  Create Git Tag  │
             │   (v1.2.3)       │
             └────────┬─────────┘
                      │
                      │ (Tag Push Triggers)
                      │
                      ▼
            ┌──────────────────┐
            │  Deploy to Prod  │
            │                  │
            │ ⏸ REQUIRES      │
            │ MANUAL APPROVAL  │
            │                  │
            │ - Deploy         │
            │ - Smoke test     │
            │ - Create Release │
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

## S3 Storage Optimization

Deployment artifacts are stored in a custom S3 bucket with aggressive cost optimization to minimize storage costs.

### Bucket Configuration

**Bucket Name:** `gadzooks-sam-artifacts`

**Management:** The S3 bucket is managed **independently** via the `scripts/create-s3-bucket.sh` script, NOT as part of the CloudFormation stack. This design ensures:
- The bucket persists even if CloudFormation stacks are deleted
- Multiple projects can share the same bucket with different prefixes
- Lifecycle policies apply consistently across all projects

**Directory Structure:**
```
gadzooks-sam-artifacts/
├── weather-expressjs/
│   ├── dev/        # Dev environment deployment packages
│   ├── qa/         # QA environment deployment packages
│   └── prod/       # Production environment deployment packages
└── <future-projects>/
```

### Cost Optimization Strategy

The bucket is configured to keep **only 1 version** of Lambda deployment artifacts per environment:

1. **Versioning Disabled**
   - S3 versioning is suspended (not enabled)
   - New deployments **overwrite** previous deployment packages
   - Guarantees only the current version exists

2. **1-Day Lifecycle Policy**
   - Automatically deletes objects older than 1 day
   - Cleans up any temporary build artifacts
   - Runs daily at midnight UTC

3. **Security Best Practices**
   - Public access completely blocked
   - All objects are private
   - IAM-based access control only

### Cost Impact

**Estimated Monthly Cost:** < $0.01/month
- Deployment package size: ~5-10 MB per environment
- 3 environments × 1 version = 15-30 MB total storage
- S3 Standard pricing: $0.023/GB/month

**Savings:** 90%+ reduction compared to indefinite artifact retention

### Initial Setup

The S3 bucket must be created once before first deployment:

```bash
# Run the initialization script
bash scripts/create-s3-bucket.sh

# Verify bucket exists
aws s3 ls s3://gadzooks-sam-artifacts --profile claudia
```

This script:
- Creates the `gadzooks-sam-artifacts` bucket in `us-west-1`
- Disables versioning (ensures 1 version only)
- Applies 1-day lifecycle policy
- Blocks all public access
- Adds resource tags

### Monitoring Storage

Check bucket contents and size:

```bash
# List all objects in the bucket
aws s3 ls s3://gadzooks-sam-artifacts --recursive --profile claudia

# Get bucket size and object count
aws s3 ls s3://gadzooks-sam-artifacts --recursive --summarize --profile claudia

# Expected result: 3-6 objects total (one per environment)
```

### Rollback Considerations

**Important:** Since only 1 version is retained per environment, instant rollback to a previous Lambda version is **not possible** via S3.

**Rollback Strategy:**
To rollback to a previous version, redeploy from git history:

```bash
# Find the commit with the working version
git log --oneline

# Checkout that commit
git checkout <commit-hash>

# Deploy to the affected environment
yarn sam:deploy         # Production
yarn sam:deploy:qa      # QA
yarn sam:deploy:dev     # Dev

# Return to latest code
git checkout master
```

**Alternative:** If you need frequent rollbacks, consider:
- Enabling S3 versioning (increases storage costs)
- Increasing lifecycle policy retention (e.g., 7 days instead of 1 day)
- Using Lambda versioning/aliases (deployed via CloudFormation)

### CI/CD Integration

GitHub Actions workflows automatically use the custom S3 bucket:
- `.github/workflows/deploy-pr.yml` - Uses `--resolve-s3` (GitHub manages bucket)
- `.github/workflows/deploy-master.yml` - Uses `--resolve-s3` (GitHub manages bucket)

**Note:** GitHub Actions still use SAM's `--resolve-s3` flag, which creates auto-managed buckets. The custom `gadzooks-sam-artifacts` bucket is used for **local deployments only** via the `--profile claudia` flag.

For full CI/CD integration with the custom bucket, update the workflow files to use:
```yaml
--s3-bucket gadzooks-sam-artifacts --s3-prefix weather-expressjs/${{ env.ENVIRONMENT }}
```

---

## Deploying to Production

Production deployments are triggered by creating and pushing semantic version tags.

### Step-by-Step Process

1. **Ensure QA is stable**
   - Merge your PR to master
   - Wait for automatic QA deployment to complete successfully
   - Test the QA environment thoroughly

2. **Create a version tag**
   ```bash
   # Create a semantic version tag
   git tag v1.2.3

   # Push the tag to trigger production deployment
   git push origin v1.2.3
   ```

3. **Approve the deployment**
   - Go to **Actions** tab in GitHub
   - Click the running "Deploy to Production" workflow
   - Click **Review deployments**
   - Select **production** environment
   - Add a comment (optional) and click **Approve and deploy**

4. **Verify deployment**
   - The workflow will deploy to production
   - Smoke tests will run automatically
   - A GitHub Release will be created with deployment details
   - Check the production URL to verify

### Version Naming Convention

Use semantic versioning (SemVer):
- **Major version** (`v2.0.0`): Breaking changes
- **Minor version** (`v1.2.0`): New features, backwards compatible
- **Patch version** (`v1.0.1`): Bug fixes, backwards compatible

### Rollback Strategy

To rollback to a previous version:
```bash
# Find the previous working version
git tag

# Redeploy that version
git push origin v1.2.2
```

The workflow will trigger again, and after approval, will deploy the previous version.

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

### Pre-commit hooks not running
- Ensure Husky is installed: `yarn install`
- Verify `.husky/pre-commit` file exists and is executable
- Check that you're committing from within the git repository
- Try running manually: `yarn lint-staged`

### Pre-commit hook fails but you need to commit anyway
- Fix the linting errors shown in the output
- Or run `git commit --no-verify` to bypass hooks (not recommended - CI will still catch the issues)

---

## Best Practices

1. **Always create a PR** - Never push directly to master
2. **Let pre-commit hooks run** - They catch issues before they reach CI (lint errors, formatting)
3. **Wait for CI and dev deployment** - Both must pass before merging (required checks)
4. **Test in dev** - Verify your changes work in the dev deployment URL provided in PR comments
5. **Review QA deployment** - After merge, check the QA environment before creating a production tag
6. **Use semantic versioning** - Tag releases with semantic versions (v1.2.3) for clear version history
7. **Test QA thoroughly** - Production deploys from tags, so ensure QA is stable first
8. **Monitor deployments** - Watch CloudWatch logs after production deployments
9. **Document releases** - Use meaningful tag messages: `git tag -a v1.2.3 -m "Add user authentication"`

---

## Workflow Files

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - CI testing and dev deployment (runs on PRs)
- [`.github/workflows/deploy-qa.yml`](../.github/workflows/deploy-qa.yml) - QA deployment (runs on merge to master)
- [`.github/workflows/deploy-prod.yml`](../.github/workflows/deploy-prod.yml) - Production deployment (runs on version tags)

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and deployment details
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
