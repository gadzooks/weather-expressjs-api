# Slack Integration Setup

This guide covers setting up the GitHub Slack app to receive deployment notifications and reminders.

## Prerequisites

- Admin access to your Slack workspace
- Admin access to the GitHub repository

## Step 1: Install GitHub Slack App

1. Go to https://slack.com/apps/A01BP7R4KNY-github
2. Click "Add to Slack"
3. Select your workspace
4. Authorize the app with requested permissions

## Step 2: Invite App to Channel

In the Slack channel where you want notifications:
```
/invite @github
```

## Step 3: Subscribe to Repository Events

Run these commands in your Slack channel:

### Basic Subscription (Workflows + Issues)
```
/github subscribe gadzooks/weather-expressjs workflows issues
```

### Detailed Workflow Subscriptions (Recommended)
```
/github subscribe gadzooks/weather-expressjs workflows:{event:"pull_request" branch:"master"}
/github subscribe gadzooks/weather-expressjs workflows:{event:"push" branch:"master"}
/github subscribe gadzooks/weather-expressjs workflows:{event:"workflow_dispatch"}
```

### Issues Subscription (for deployment reminders)
```
/github subscribe gadzooks/weather-expressjs issues
```

## Step 4: Configure Filters (Optional)

To reduce noise, you can filter by workflow name:
```
/github subscribe gadzooks/weather-expressjs workflows:{name:"Deploy to Production"}
```

## Step 5: Test Integration

1. Go to GitHub Actions tab
2. Manually trigger the "Deploy to Production" workflow
3. Verify that:
   - Workflow start notification appears in Slack
   - Deployment summary appears as thread reply
   - Failure notifications appear (if deployment fails)

## What You'll Receive

### Deployment Notifications
- **Dev Deployments:** On every PR update
- **QA Deployments:** On every merge to master
- **Prod Deployments:** On manual production deploys

Each includes:
- Environment name
- Deployment status (success/failure)
- API URL
- Production diff (prod only)

### Weekly Reminders
- Issue created every Monday if prod is 7+ days old
- Single issue updated (not spam)
- Includes link to trigger deployment

## Troubleshooting

### No notifications appearing
1. Check app is invited to channel: `/invite @github`
2. Verify subscription: `/github subscribe list`
3. Check GitHub app permissions in repo settings

### Too many notifications
Use filters to limit workflows:
```
/github unsubscribe gadzooks/weather-expressjs workflows
/github subscribe gadzooks/weather-expressjs workflows:{event:"workflow_dispatch"}
```

### Reminder not working
1. Check cron schedule is enabled (GitHub may disable after 60 days inactivity)
2. Manually trigger: Actions tab → "Production Deployment Reminder" → Run workflow

## Managing Subscriptions

View current subscriptions:
```
/github subscribe list
```

Unsubscribe from events:
```
/github unsubscribe gadzooks/weather-expressjs workflows
```

## Additional Resources

- [GitHub Slack App Documentation](https://github.com/integrations/slack)
- [Customizing Notifications](https://docs.github.com/en/integrations/how-tos/slack/customize-notifications)
