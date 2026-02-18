/**
 * Custom Error Classes for Jira Bug Service
 * 
 * Provides specific error types for different failure scenarios
 * to enable better error handling and debugging.
 */

/**
 * Base error class for all Jira-related errors
 * @extends Error
 */
export class JiraError extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'JiraError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when Jira API authentication fails
 * @extends JiraError
 */
export class JiraAuthenticationError extends JiraError {
  constructor(message = 'Jira authentication failed. Check your API token.') {
    super(message, 401);
    this.name = 'JiraAuthenticationError';
  }
}

/**
 * Error thrown when Jira API request times out
 * @extends JiraError
 */
export class JiraTimeoutError extends JiraError {
  constructor(message = 'Jira API request timed out after 30 seconds.') {
    super(message);
    this.name = 'JiraTimeoutError';
  }
}

/**
 * Error thrown when an invalid JQL query is sent
 * @extends JiraError
 */
export class JiraQueryError extends JiraError {
  constructor(message = 'Invalid JQL query syntax.', jql = null) {
    super(message, 400);
    this.name = 'JiraQueryError';
    this.jql = jql;
  }
}

/**
 * Error thrown when an unknown team is referenced
 * @extends Error
 */
export class UnknownTeamError extends Error {
  constructor(teamId) {
    super(`Unknown team: ${teamId}. Valid teams: minerva, guardians, athena`);
    this.name = 'UnknownTeamError';
    this.teamId = teamId;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested Jira resource is not found
 * @extends JiraError
 */
export class JiraResourceNotFoundError extends JiraError {
  constructor(resource) {
    super(`Jira resource not found: ${resource}`, 404);
    this.name = 'JiraResourceNotFoundError';
    this.resource = resource;
  }
}

/**
 * Error thrown when Jira API rate limit is exceeded
 * @extends JiraError
 */
export class JiraRateLimitError extends JiraError {
  constructor(message = 'Jira API rate limit exceeded. Please retry later.') {
    super(message, 429);
    this.name = 'JiraRateLimitError';
  }
}
