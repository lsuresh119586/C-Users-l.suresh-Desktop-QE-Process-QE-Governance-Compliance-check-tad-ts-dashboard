---
description: Create or update the feature specification from a natural language feature description. Includes Tests Covered specification.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## ✅ Tests Covered Specification (COMPLETED)

**Feature**: Test Metrics Dashboard - Real-time visualization of test automation coverage

**User Stories**:
1. **View Test Metrics by Sprint** (P1)
   - As a QE Lead, see automation coverage % by sprint
   - Acceptance: Sprint selector, coverage %, test counts displayed

2. **View Team Test Breakdown** (P1)
   - As a QE Manager, see team-level automation coverage
   - Acceptance: Team breakdown table with coverage % per team

3. **Real-time Dashboard Navigation** (P1)
   - As a COP member, click "Tests Covered" card to open dashboard
   - Acceptance: Card clickable, dashboard opens, back button returns

**Acceptance Scenarios**:
- Click Tests Covered card → dashboard opens with current sprint selected
- Sprint dropdown populated with available sprints (26.1.1, 26.1.2, 26.1.3)
- Metrics displayed: total tests, automated, manual, coverage %
- Team table shows all teams with individual coverage %
- Progress bars visualize coverage percentage
- Back button returns to main dashboard
- Dashboard responsive on mobile/tablet/desktop

**Implementation Status**:
- ✅ Backend API (ports 3000, 3001) - COMPLETED
- ✅ Frontend dashboard - COMPLETED  
- ✅ Sample data (345 tests) - COMPLETED
- ✅ Navigation integration - COMPLETED
- ✅ Responsive design - COMPLETED
- ✅ Validation testing - COMPLETED (90% pass rate)

**Reference Files**:
- Specification: `specs/001-jira-tad-dashboard/spec.md`
- Implementation: `TESTS_COVERED_IMPLEMENTATION.md`
- API docs: `backend/api-gateway/server-temp.js`

---

## Outline (Standard Specification Process)

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the branch:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Check for existing branches before creating new one**:

   a. First, fetch all remote branches to ensure we have the latest information:

      ```bash
      git fetch --all --prune
      ```

   b. Find the highest feature number across all sources for the short-name:
      - Remote branches: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
      - Local branches: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
      - Specs directories: Check for directories matching `specs/[0-9]+-<short-name>`

   c. Determine the next available number:
      - Extract all numbers from all three sources
      - Find the highest number N
      - Use N+1 for the new branch number

   d. Run the script `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS"` with the calculated number and short-name:
      - Pass `--number N+1` and `--short-name "your-short-name"` along with the feature description
      - Bash example: `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS" --json --number 5 --short-name "user-auth" "Add user authentication"`
      - PowerShell example: `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS" -Json -Number 5 -ShortName "user-auth" "Add user authentication"`

   **IMPORTANT**:
   - Check all three sources (remote branches, local branches, specs directories) to find the highest number
   - Only match branches/directories with the exact short-name pattern
   - If no existing branches/directories found with this short-name, start with number 1
   - You must only ever run this script once per feature
   - The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for
   - The JSON output will contain BRANCH_NAME and SPEC_FILE paths
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot")

3. Load `.specify/templates/spec-template.md` to understand required sections.

4. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
    4. Create specification with sections:
       - Summary
       - Acceptance Criteria
       - User Stories with priorities
       - Testing Requirements
       - Constraints & Dependencies
