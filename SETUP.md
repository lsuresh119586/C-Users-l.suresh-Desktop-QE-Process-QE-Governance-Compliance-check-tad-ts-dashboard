# Environment Setup

This project requires a Jira API token to fetch sprint data.

## Setting up the Jira API Token

1. Create a `.env` file in the `tad-ts-dashboard` directory
2. Add your Jira API token:
```
JIRA_API_TOKEN=your_token_here
```

The `.env` file is gitignored for security.

## VPN Connection Required

To regenerate sprint reports, you must be connected to the corporate VPN to access `jira.es.ad.adp.com`.

## Regenerating Sprint Reports

Once connected to VPN and with `.env` configured:

```powershell
cd tad-ts-dashboard
python sprint-tad-ts-report.py sprint=26.1.1
python sprint-tad-ts-report.py sprint=26.1.2
python sprint-tad-ts-report.py sprint=26.1.3
python sprint-tad-ts-report.py sprint=26.1.4
```
