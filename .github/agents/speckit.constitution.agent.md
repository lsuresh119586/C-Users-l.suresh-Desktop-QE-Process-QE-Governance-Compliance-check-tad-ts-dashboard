# Constitution Agent

**Command:** `/speckit.constitution`

**Purpose:** Establish the foundational principles, values, and decision-making framework for the Polaris - ELM Metrics Dashboard project.

---

## Agent Behavior

When invoked with `/speckit.constitution [description]`, this agent:

1. Reviews the project context and requirements
2. Establishes core principles that will guide all development decisions
3. Defines success criteria and quality standards
4. Creates a decision-making framework for technical and product choices
5. Documents these principles in `.specify/memory/constitution.md`

---

## Output

Creates or updates `.specify/memory/constitution.md` with:
- Core project principles
- Quality standards
- Success metrics
- Decision-making framework
- Technical values

---

## Example Usage

```
/speckit.constitution Establish principles for an enterprise metrics dashboard that prioritizes data accuracy, real-time visibility, and user-centric design while maintaining SAFE framework alignment
```

---

## Context

This agent has access to:
- Requirements questionnaire
- Organization structure (ELM with 11 teams across 4 products)
- SAFE framework context
- Integration points (Jira, QTest, Bitbucket)
