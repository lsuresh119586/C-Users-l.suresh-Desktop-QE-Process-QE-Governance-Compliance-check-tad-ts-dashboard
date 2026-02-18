# Implement Agent

**Command:** `/speckit.implement`

**Purpose:** Execute implementation of tasks with full traceability back to specifications.

---

## Agent Behavior

When invoked with `/speckit.implement [task-id or feature-description]`, this agent:

1. Reviews the task requirements from `tasks.md`
2. References the specification (`spec.md`) and plan (`plan.md`)
3. Implements the code following best practices
4. Writes comprehensive unit tests
5. Updates task status
6. Creates/updates documentation

---

## Implementation Guidelines

### Code Quality Standards

**TypeScript/JavaScript:**
- Use TypeScript strict mode
- Follow Airbnb or StandardJS style guide
- Prefer functional programming patterns
- Use async/await over callbacks
- Proper error handling with try-catch
- JSDoc comments for public APIs

**Python:**
- Follow PEP 8 style guide
- Type hints for all functions
- Docstrings for all modules/classes/functions
- Use dataclasses for data structures
- Proper exception handling

**React:**
- Functional components with hooks
- Custom hooks for reusable logic
- Proper prop-types or TypeScript interfaces
- Component composition over inheritance
- Separate concerns (container vs presentational)

### Testing Requirements

**Every implementation must include:**

1. **Unit Tests**
   - Test all business logic
   - Test edge cases and error conditions
   - Aim for >80% code coverage
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Integration Tests (where applicable)**
   - Test API endpoints
   - Test database interactions
   - Test MCP integrations

3. **E2E Tests with Playwright (for user-facing features)**
   - Test complete user workflows
   - Test across different viewports
   - Validate data accuracy
   - Use Playwright MCP tools

### Example Unit Test Structure

```typescript
describe('MetricsAggregationService', () => {
  describe('calculateTADCompletionRate', () => {
    it('should return 100% when all stories have TAD documents', () => {
      // Arrange
      const stories = [
        { id: '1', hasTAD: true },
        { id: '2', hasTAD: true }
      ];
      
      // Act
      const result = calculateTADCompletionRate(stories);
      
      // Assert
      expect(result).toBe(100);
    });

    it('should return 50% when half the stories have TAD documents', () => {
      // Arrange
      const stories = [
        { id: '1', hasTAD: true },
        { id: '2', hasTAD: false }
      ];
      
      // Act
      const result = calculateTADCompletionRate(stories);
      
      // Assert
      expect(result).toBe(50);
    });

    it('should handle empty array', () => {
      expect(calculateTADCompletionRate([])).toBe(0);
    });
  });
});
```

### Example Playwright E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Metrics Display', () => {
  test('should display correct TAD completion metrics for selected sprint', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000');
    
    // Select sprint
    await page.selectOption('[data-testid="sprint-selector"]', 'Sprint 26.1.2');
    await page.click('[data-testid="load-data-button"]');
    
    // Wait for data to load
    await expect(page.locator('[data-testid="tad-complete-card"]')).toBeVisible();
    
    // Verify metrics
    const tadComplete = await page.locator('[data-testid="tad-complete-value"]').textContent();
    const tadPercentage = await page.locator('[data-testid="tad-complete-percentage"]').textContent();
    
    expect(tadComplete).toBe('17');
    expect(tadPercentage).toBe('100.0%');
  });
});
```

### Documentation Requirements

**Every implementation should update:**
- Inline code comments for complex logic
- README.md if new setup steps are needed
- API documentation if endpoints are added
- Component documentation if UI components are created

---

## Traceability

Every implementation must reference:
- Task ID from `tasks.md`
- Requirement from `spec.md`
- Component from `plan.md`

Example commit message:
```
TASK-042: Implement TAD completion metric calculation

- Implements MetricsAggregationService.calculateTADCompletionRate()
- Fetches TAD status from Jira MCP server
- Handles N/A cases per spec section 3.2.1
- Unit tests with 95% coverage
- Traces to spec.md section 3.2: "TAD Document Completion Rate"
```

---

## Output

- Production code in appropriate directories
- Comprehensive test suites
- Updated documentation
- Task marked as complete in tasks.md

---

## Example Usage

```
/speckit.implement TASK-042

or

/speckit.implement Add TAD completion rate calculation with Jira MCP integration
```

---

## Best Practices Checklist

Before marking a task complete:
- [ ] Code follows project style guide
- [ ] All business logic has unit tests (>80% coverage)
- [ ] Integration tests written for APIs/database
- [ ] E2E tests written for user-facing features (using Playwright MCP)
- [ ] No console.log or debugging code
- [ ] Error handling implemented
- [ ] Type safety ensured (TypeScript/Python type hints)
- [ ] Code reviewed (self-review at minimum)
- [ ] Documentation updated
- [ ] Git commit has proper traceability message
