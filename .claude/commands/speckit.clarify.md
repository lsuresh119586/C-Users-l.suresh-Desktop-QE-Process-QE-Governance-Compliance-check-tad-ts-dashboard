---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec. Tests Covered is fully specified.
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## ✅ Tests Covered Clarification (COMPLETED)

**Specification Status**: FULLY CLARIFIED AND IMPLEMENTED ✅

**Key Clarifications Resolved**:

1. **Data Source Clarification**: 
   - ✅ Resolved: qTest Cloud API v3 (with fallback to sample data)
   - ✅ Implementation: `backend/api-gateway/qtest-service.js` handles both

2. **Metrics Definition Clarification**:
   - ✅ Resolved: Automation Coverage % = (automated tests / total tests) × 100
   - ✅ Implementation: Calculation in API response

3. **Team Scope Clarification**:
   - ✅ Resolved: All teams across all sprints
   - ✅ Implementation: Team breakdown table includes all teams

4. **Sprint Selection Clarification**:
   - ✅ Resolved: Dropdown selector with available sprints
   - ✅ Implementation: React/HTML component with sprint options

5. **Navigation Clarification**:
   - ✅ Resolved: Seamless integration with main dashboard
   - ✅ Implementation: Click Tests Covered card → dashboard, back button → main

**No Unresolved Ambiguities**: All specification requirements clearly defined and implemented.

**Reference**: See `specs/001-jira-tad-dashboard/spec.md` for complete specification.

---

## Outline (Standard Clarification Process)

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

Note: This clarification workflow is expected to run (and be completed) BEFORE invoking `/speckit.plan`. If the user explicitly states they are skipping clarification (e.g., exploratory spike), you may proceed, but must warn that downstream rework risk increases.

Execution steps:

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly` from repo root **once** (combined `--json --paths-only` mode / `-Json -PathsOnly`). Parse minimal JSON payload fields:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`

2. Identify underspecified areas and ask clarification questions

3. Document answers in spec.md

4. Mark clarifications as RESOLVED
