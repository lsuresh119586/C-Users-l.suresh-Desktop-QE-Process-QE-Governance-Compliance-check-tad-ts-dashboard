import https from 'https';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getJiraBaseUrl = () => {
  const configured = process.env.JIRA_BASE_URL || process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
};

const getToken = () => process.env.JIRA_API_TOKEN_PASSPORT || process.env.JIRA_API_TOKEN;

const jiraRequest = async (requestPath, method = 'GET', body = null) => {
  const token = getToken();
  if (!token) {
    throw new Error('Missing JIRA_API_TOKEN or JIRA_API_TOKEN_PASSPORT');
  }

  const fullUrl = new URL(`${getJiraBaseUrl()}${requestPath}`);
  const requestBody = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: fullUrl.hostname,
        port: 443,
        path: `${fullUrl.pathname}${fullUrl.search}`,
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch {
              reject(new Error(`Invalid JSON from Jira: ${body.slice(0, 300)}`));
            }
            return;
          }

          reject(new Error(`Jira request failed (${res.statusCode}) for ${fullUrl.pathname}${fullUrl.search}: ${body.slice(0, 500)}`));
        });
      }
    );

    req.on('error', reject);
    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
};

const resolveSafeTeamField = async () => {
  const configuredId = process.env.JIRA_FIELD_SAFE_TEAM_ID;
  const configuredName = process.env.JIRA_FIELD_SAFE_TEAM_NAME;

  const fields = await jiraRequest('/rest/api/2/field');
  const namedFields = (fields || []).map((field) => ({
    id: field.id,
    name: field.name,
    normalized: normalizeText(field.name)
  }));

  if (configuredId) {
    const byId = namedFields.find((field) => field.id === configuredId);
    return { id: configuredId, name: configuredName || byId?.name || configuredId };
  }

  if (configuredName) {
    const byName = namedFields.find((field) => field.normalized === normalizeText(configuredName));
    if (byName) {
      return { id: byName.id, name: byName.name };
    }
  }

  const candidate = namedFields.find((field) => field.normalized === 'safe-team')
    || namedFields.find((field) => field.normalized === 'safe team')
    || namedFields.find((field) => field.normalized.includes('safe') && field.normalized.includes('team'));

  if (!candidate) {
    throw new Error('Unable to resolve Safe-Team field from Jira fields');
  }

  return { id: candidate.id, name: candidate.name };
};

const resolveProjectKey = async () => {
  const configuredProjectKey = process.env.JIRA_CPOD_PROJECT_KEY;
  if (configuredProjectKey) {
    return configuredProjectKey;
  }

  const projects = await jiraRequest('/rest/api/2/project');
  const match = (projects || []).find((project) => normalizeText(project?.name) === 'elm tech ops');
  if (match?.key) {
    return match.key;
  }

  throw new Error('Unable to resolve project key for "ELM Tech Ops". Set JIRA_CPOD_PROJECT_KEY env var.');
};

const getAllowedOptionsFromCreateMeta = async ({ projectKey, issueTypeName, safeTeamFieldId }) => {
  const encodedProjectKey = encodeURIComponent(projectKey);
  const encodedIssueType = encodeURIComponent(issueTypeName);
  const path = `/rest/api/2/issue/createmeta?projectKeys=${encodedProjectKey}&issuetypeNames=${encodedIssueType}&expand=projects.issuetypes.fields`;

  const meta = await jiraRequest(path);
  const project = meta?.projects?.[0];
  const issueType = project?.issuetypes?.[0];
  const field = issueType?.fields?.[safeTeamFieldId];
  const allowedValues = Array.isArray(field?.allowedValues) ? field.allowedValues : [];

  return {
    required: Boolean(field?.required),
    schema: field?.schema || {},
    options: allowedValues
      .map((option) => String(option?.value || option?.name || '').trim())
      .filter(Boolean)
  };
};

const getObservedOptionsFromSearch = async ({ projectKey, issueTypeName, safeTeamFieldId }) => {
  const jql = `project = "${projectKey}" AND issuetype = "${issueTypeName}" AND status = Closed ORDER BY updated DESC`;

  const response = await jiraRequest('/rest/api/2/search', 'POST', {
    jql,
    startAt: 0,
    maxResults: 200,
    fields: [safeTeamFieldId]
  });

  const options = new Set();
  const issues = Array.isArray(response?.issues) ? response.issues : [];

  for (const issue of issues) {
    const raw = issue?.fields?.[safeTeamFieldId];
    if (raw && typeof raw === 'object' && 'value' in raw && raw.value) {
      options.add(String(raw.value).trim());
      continue;
    }

    if (Array.isArray(raw)) {
      for (const item of raw) {
        const value = item?.value || item?.name || item;
        if (value) {
          options.add(String(value).trim());
        }
      }
      continue;
    }

    if (raw) {
      options.add(String(raw).trim());
    }
  }

  return {
    sampleIssueCount: issues.length,
    options: [...options].filter(Boolean)
  };
};

const main = async () => {
  const issueTypeName = process.env.JIRA_CPOD_ISSUETYPE || 'Bug';

  const safeTeamField = await resolveSafeTeamField();
  const projectKey = await resolveProjectKey();

  console.log(`Jira base URL: ${getJiraBaseUrl()}`);
  console.log(`Project key: ${projectKey}`);
  console.log(`Issue type: ${issueTypeName}`);
  console.log(`Safe-Team field: ${safeTeamField.id} (${safeTeamField.name})`);

  try {
    const result = await getAllowedOptionsFromCreateMeta({
      projectKey,
      issueTypeName,
      safeTeamFieldId: safeTeamField.id
    });

    console.log(`Safe-Team required on create: ${result.required}`);

    if (!result.options.length) {
      console.log('No allowed values found in create metadata for this field/context.');
      return;
    }

    console.log('Allowed Safe-Team options (metadata):');
    for (const option of result.options) {
      console.log(`- ${option}`);
    }

    console.log('');
    console.log('Suggested env value:');
    console.log(`CPOD_ALLOWED_SAFE_TEAMS=${result.options.join(',')}`);
    return;
  } catch (metadataError) {
    console.log(`Metadata lookup failed: ${metadataError.message}`);
    console.log('Falling back to observed options from Jira search results...');
  }

  const observed = await getObservedOptionsFromSearch({
    projectKey,
    issueTypeName,
    safeTeamFieldId: safeTeamField.id
  });

  if (!observed.options.length) {
    console.log(`No Safe-Team values observed in ${observed.sampleIssueCount} sampled issues.`);
    return;
  }

  console.log(`Observed Safe-Team options from ${observed.sampleIssueCount} issues:`);
  for (const option of observed.options) {
    console.log(`- ${option}`);
  }

  console.log('');
  console.log('Suggested env value:');
  console.log(`CPOD_ALLOWED_SAFE_TEAMS=${observed.options.join(',')}`);
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
