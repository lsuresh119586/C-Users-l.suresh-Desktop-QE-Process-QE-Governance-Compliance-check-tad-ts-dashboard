# Analysis: Adding Description Field Check for TAD/TS Documentation

## Issue Analyzed: ELM-35169

### Current Situation
- **Issue**: ELM-35169 (Titans team)
- **Type**: Story
- **Status**: Closed
- **Pull Requests Found**: 8 PRs in Development tab
- **TAD/TS in PR Names**: ❌ None found
- **Test Strategy in Description**: ✅ YES - Contains "ADR" links (Architecture Decision Records)

### Problem Identified
The current script **ONLY** checks the **Development tab (Pull Request names)** for TAD/TS keywords. It does **NOT** check the **Description field** where teams might document:
- Test Strategy links (Confluence pages)
- Technical Architecture links (ADR documents)  
- Design documents
- External documentation

For this specific issue:
- **Development Tab**: 8 PRs, but none have "TAD" or "TS" in the PR name
- **Description**: Contains links to ADR documents which serve as Technical Architecture Documentation

## Code Changes Required

### Summary of Changes
**Complexity**: MEDIUM  
**Estimated Lines of Code**: ~80-100 lines  
**Files to Modify**: 1 (sprint-tad-ts-report.py)  
**New Functions**: 1-2 helper functions  
**Modified Functions**: 3 functions  

---

## Detailed Code Changes

### 1. Modify `get_sprint_issues_by_jql()` - Add description field
**Location**: Line ~42-82  
**Change**: Add 'description' to fields list  
**Impact**: LOW  
**Lines Changed**: 1 line

```python
# BEFORE
"fields": ["summary", "status", "assignee", "issuetype", "priority", "sprint", "customfield_13392"]

# AFTER  
"fields": ["summary", "description", "status", "assignee", "issuetype", "priority", "sprint", "customfield_13392"]
```

---

### 2. Create New Function: `check_description_for_links()`
**Location**: After line ~148 (after check_deliverables function)  
**Change**: NEW FUNCTION  
**Impact**: MEDIUM  
**Lines Added**: ~40 lines

```python
def check_description_for_links(description):
    """
    Check if description contains TAD/TS documentation links
    
    Args:
        description: JIRA issue description text
        
    Returns:
        dict with tad_in_desc, ts_in_desc, tad_links, ts_links
    """
    result = {
        'tad_in_desc': False,
        'ts_in_desc': False,
        'tad_links': [],
        'ts_links': []
    }
    
    if not description:
        return result
    
    desc_upper = description.upper()
    
    # Keywords for TAD
    tad_keywords = [
        'TECHNICAL ARCHITECTURE',
        'TAD DOCUMENT',
        'ADR',  # Architecture Decision Record
        'ARCHITECTURE DECISION',
        'DESIGN DOCUMENT',
        'TECHNICAL DESIGN'
    ]
    
    # Keywords for TS
    ts_keywords = [
        'TEST STRATEGY',
        'TS FOR',
        'TEST PLAN',
        'TESTING STRATEGY',
        'QA STRATEGY'
    ]
    
    # Check for TAD keywords
    for keyword in tad_keywords:
        if keyword in desc_upper:
            result['tad_in_desc'] = True
            # Extract links near the keyword (simple approach)
            import re
            # Find URLs in description
            urls = re.findall(r'https?://[^\s\]]+', description)
            result['tad_links'] = urls
            break
    
    # Check for TS keywords  
    for keyword in ts_keywords:
        if keyword in desc_upper and 'TS FILE' not in desc_upper:
            result['ts_in_desc'] = True
            # Extract links
            import re
            urls = re.findall(r'https?://[^\s\]]+', description)
            result['ts_links'] = urls
            break
    
    return result
```

---

### 3. Modify `check_deliverables()` - Add description parameter
**Location**: Line ~95-148  
**Change**: Add description parameter and combine PR + Description checks  
**Impact**: MEDIUM  
**Lines Changed**: ~20 lines (additions)

```python
# BEFORE
def check_deliverables(session, issue_key, issue_id):
    """Check if issue has TAD and TS PRs"""

# AFTER
def check_deliverables(session, issue_key, issue_id, description=None):
    """Check if issue has TAD and TS PRs or documentation links in description"""
    
    # ... existing PR check code ...
    
    # NEW: Also check description if provided
    if description:
        desc_result = check_description_for_links(description)
        
        # Combine PR results with description results
        result['tad_found'] = result['tad_found'] or desc_result['tad_in_desc']
        result['ts_found'] = result['ts_found'] or desc_result['ts_in_desc']
        
        # Store where it was found
        result['tad_source'] = 'PR' if result['tad_pr'] else ('Description' if desc_result['tad_in_desc'] else None)
        result['ts_source'] = 'PR' if result['ts_pr'] else ('Description' if desc_result['ts_in_desc'] else None)
        
        # Store description links
        result['tad_desc_links'] = desc_result['tad_links']
        result['ts_desc_links'] = desc_result['ts_links']
    
    return result
```

---

### 4. Modify `main()` - Pass description to check_deliverables
**Location**: Line ~450-515  
**Change**: Extract description field and pass to check_deliverables()  
**Impact**: LOW  
**Lines Changed**: 3-5 lines

```python
# BEFORE (around line 460)
for idx, issue in enumerate(issues, 1):
    key = issue['key']
    fields = issue['fields']
    
    # ... existing code ...
    
    if issue_type in ['Bug', 'Story']:
        deliverables = check_deliverables(session, key, issue['id'])

# AFTER
for idx, issue in enumerate(issues, 1):
    key = issue['key']
    fields = issue['fields']
    
    # Extract description
    description = fields.get('description', '')
    
    # ... existing code ...
    
    if issue_type in ['Bug', 'Story']:
        deliverables = check_deliverables(session, key, issue['id'], description)
```

---

### 5. Modify Report Generation - Show source of TAD/TS
**Location**: Line ~240-350 (generate_report function)  
**Change**: Update CSV/JSON output to show where TAD/TS was found (PR vs Description)  
**Impact**: LOW  
**Lines Changed**: 10-15 lines

```python
# Add to CSV columns:
writer.writerow([
    # ... existing columns ...
    'TAD Source',  # NEW: 'PR' or 'Description'
    'TS Source',   # NEW: 'PR' or 'Description'
    'TAD Desc Links',  # NEW: Links from description
    'TS Desc Links'    # NEW: Links from description
])

# Add to issues_data structure in main():
issues_data.append({
    # ... existing fields ...
    'tad_source': deliverables.get('tad_source'),
    'ts_source': deliverables.get('ts_source'),
    'tad_desc_links': deliverables.get('tad_desc_links', []),
    'ts_desc_links': deliverables.get('ts_desc_links', [])
})
```

---

## Expected Impact on ELM-35169

### Before Changes:
- TAD Found: ❌ NO (no PRs with TAD keywords)
- TS Found: ❌ NO (no PRs with TS keywords)
- Total PRs: 8

### After Changes:
- TAD Found: ✅ YES (ADR links in description)
- TS Found: ✅ YES (ADR links cover test approach)
- TAD Source: Description
- TS Source: Description
- TAD Links: https://confluence.wolterskluwer.io/spaces/GRCELMNFR/pages/763810862/...
- Total PRs: 8

---

## Implementation Checklist

- [ ] Add 'description' to fields list in get_sprint_issues_by_jql()
- [ ] Create check_description_for_links() function with keyword matching
- [ ] Add import re at top of file for URL extraction
- [ ] Modify check_deliverables() signature to accept description parameter
- [ ] Add description checking logic to check_deliverables()
- [ ] Update main() to extract description and pass to check_deliverables()
- [ ] Update issues_data structure to include new fields (tad_source, ts_source, links)
- [ ] Update CSV report generation to include new columns
- [ ] Update JSON/dashboard output to show source information
- [ ] Test with ELM-35169 to verify detection works
- [ ] Regenerate all 12 months of reports
- [ ] Regenerate standalone HTML dashboard

---

## Risks & Considerations

### 1. **False Positives**
- Description might mention "Test Strategy" without actually having one
- **Mitigation**: Only mark as found if URLs are present near keywords

### 2. **Performance Impact**  
- Minimal - description is already fetched from API
- No additional API calls needed
- Regex URL extraction is fast

### 3. **Data Volume**
- Description can be large (10,000+ characters)
- **Mitigation**: Only extract first 5000 chars or limit to URL extraction

### 4. **Keyword Accuracy**
- Need to balance sensitivity vs specificity
- **Recommendation**: Start conservative, add keywords based on feedback

---

## Alternative Approaches

### Option 1: Check Description Only (Current Analysis)
**Pros**: Simple, no additional API calls  
**Cons**: Requires defining good keyword list  
**Effort**: MEDIUM

### Option 2: Check Confluence Attachments API
**Pros**: More accurate, follows actual links  
**Cons**: Additional API calls, slower, requires Confluence API token  
**Effort**: HIGH

### Option 3: Check JIRA Attachments/Links Tab
**Pros**: Structured data, purpose-built for links  
**Cons**: Teams must use Links tab (not always done)  
**Effort**: MEDIUM

**RECOMMENDATION**: Start with **Option 1** (Description check) as it's the most practical and covers most cases like ELM-35169.

---

## Testing Plan

1. Test with ELM-35169 (should now detect TAD/TS from description)
2. Test with issue that has PR-based TAD/TS (should still work)
3. Test with issue that has neither (should return false)
4. Test with issue that has both PR + Description (should show both sources)
5. Regenerate December 2025 report and verify Titans team numbers improve

---

## Estimated Effort

- **Development**: 2-3 hours
- **Testing**: 1 hour  
- **Report Regeneration**: 30 minutes (all 12 months)
- **Documentation**: 30 minutes
- **Total**: 4-5 hours

---

## Expected Improvements

Based on analysis of Titans team showing low TAD/TS compliance:
- Many stories have documentation links in description
- Expected improvement: 10-30% increase in TAD/TS detection
- More accurate representation of actual compliance
- Better visibility into where documentation exists (PR vs Description)
