# Sprint 26.1.1 - Complete Test Case Breakdown

**Report Generated:** January 13, 2026

## Executive Summary

| Team | Test Cases | Automated | Not Automated | Automation % |
|------|-----------|-----------|---------------|-------------|
| **Vanguards** | 158 | 28 | 130 | 17.7% |
| **Nexus** | 34 | 17 | 17 | 50.0% |
| **Chubb** | 19 | 0 | 19 | 0.0% |
| **Matrix** | 11 | 7 | 4 | 63.6% |
| **Chargers** | 3 | 0 | 3 | 0.0% |
| **Mavericks** | 28 | 6 | 22 | 21.4% |
| **GRAND TOTAL** | **253** | **58** | **195** | **22.9%** |

---

## Detailed Breakdown by Team

### 1. VANGUARDS (158 Test Cases)

| Story/Feature | Module ID | Test Cases | Automated | Manual | Automation % | Notes |
|--------------|-----------|-----------|-----------|--------|--------------|-------|
| GET-56987 (ASVS Unicode passwords) | 68163935 | 29 | 0 | 29 | 0.0% | Unicode character password validation |
| GET-62908 (Invoice AI Payloads) | 68182935 | 59 | 23 | 36 | 39.0% | Budget & adjustment data in payloads |
| GET-64675 (Citation transformation) | 68185186 | 27 | 0 | 27 | 0.0% | Transform citations to numbered references |
| GET-64677 (Interactive links) | 68185190 | 20 | 5 | 15 | 25.0% | Convert citations to interactive links |
| TO-10962 (Timekeeper ID display) | 68183465 | 23 | 0 | 23 | 0.0% | TK ID display behavior fix |
| **VANGUARDS TOTAL** | - | **158** | **28** | **130** | **17.7%** | - |

---

### 2. NEXUS (34 Test Cases)

| Story/Feature | Module ID | Test Cases | Automated | Manual | Automation % | Notes |
|--------------|-----------|-----------|-----------|--------|--------------|-------|
| GET-64300 (Case Assessment) | 68184636 | 11 | 6 | 5 | 54.5% | Corporate user case assessment |
| GET-3928 (Search performance) | 68184637 | 12 | 5 | 7 | 41.7% | Invoice search page performance |
| GET-63638 (Matter AI label) | 68195895 | 6 | 6 | 0 | 100.0% | AI Assistant label update (Tosca) |
| GET-50527 (Database index) | 68196472 | 5 | 5 | 0 | 100.0% | SIR database performance (Tosca) |
| **NEXUS TOTAL** | - | **34** | **17** | **17** | **50.0%** | - |

---

### 3. MAVERICKS (28 Test Cases)

| Story/Feature | Module ID | Test Cases | Automated | Manual | Automation % | Notes |
|--------------|-----------|-----------|-----------|--------|--------------|-------|
| GET-60431 (Matter AI label) | 68195895 | 6 | 6 | 0 | 100.0% | Matter AI label update (Tosca) |
| GET-61996 (Search special chars) | 68182972 | 6 | 0 | 6 | 0.0% | Global search with special characters |
| GET-61996 (Global search spinner) | 68196337 | 6 | 6 | 0 | 100.0% | Search spinner timeout fix (Tosca) |
| GET-62132 (AI Console) | 68195898 | 10 | 0 | 10 | 0.0% | AI Console customer configuration |
| **MAVERICKS TOTAL** | - | **28** | **6** | **22** | **21.4%** | - |

---

### 4. CHUBB (19 Test Cases)

| Story/Feature | Module ID | Test Cases | Automated | Manual | Automation % | Notes |
|--------------|-----------|-----------|-----------|--------|--------------|-------|
| Sprint 26.1.1 (General) | 68181234 | 19 | 0 | 19 | 0.0% | ITP rules, vendor data, predictive insights |
| **CHUBB TOTAL** | - | **19** | **0** | **19** | **0.0%** | - |

**Test Coverage Areas:**
- Affiliated Vendor Data Exchange (4 cases)
- Bypass Claim Authority Approval (4 cases)
- ITP Rule "Timekeeper hours limit" (7 cases)
- Predictive Insights Rescoring (4 cases)

---

### 5. MATRIX (11 Test Cases)

| Story/Feature | Module ID | Test Cases | Automated | Manual | Automation % | Notes |
|--------------|-----------|-----------|-----------|--------|--------------|-------|
| GET-66026 (Menu visibility) | 68186055 | 8 | 7 | 1 | 87.5% | Jobs Scheduler menu access (Tosca) |
| GET-67182 (JAMS migration) | 68189214 | 3 | 0 | 3 | 0.0% | Scheduler platform migration (Candidates) |
| **MATRIX TOTAL** | - | **11** | **7** | **4** | **63.6%** | - |

---

### 6. CHARGERS (3 Test Cases)

| Story/Feature | Module ID | Test Cases | Automated | Manual | Automation % | Notes |
|--------------|-----------|-----------|-----------|--------|--------------|-------|
| GET-65633 (Document modernization) | 68189034 | 2 | 0 | 2 | 0.0% | Dual Write off functionality |
| GET-65980 (.NET 9.0 upgrade) | 68196214 | 1 | 0 | 1 | 0.0% | DDD Template .NET 9.0 upgrade |
| **CHARGERS TOTAL** | - | **3** | **0** | **3** | **0.0%** | - |

---

## Automation Tool Distribution

| Team | Tosca | Manual | Total | Tosca % |
|------|-------|--------|-------|---------|
| Vanguards | 28 | 130 | 158 | 17.7% |
| Nexus | 17 | 17 | 34 | 50.0% |
| Mavericks | 6 | 22 | 28 | 21.4% |
| Matrix | 7 | 4 | 11 | 63.6% |
| Chubb | 0 | 19 | 19 | 0.0% |
| Chargers | 0 | 3 | 3 | 0.0% |
| **TOTAL** | **58** | **195** | **253** | **22.9%** |

---

## Key Insights

### Automation Leaders
1. **Matrix Team**: 63.6% automation (7/11 cases) - Highest automation rate
2. **Nexus Team**: 50.0% automation (17/34 cases) - Balanced automation
3. **Mavericks Team**: 21.4% automation (6/28 cases) - Mixed automation

### Automation Opportunities
1. **Chubb Team**: 0% automation (0/19 cases) - All manual
2. **Chargers Team**: 0% automation (0/3 cases) - All manual
3. **Vanguards Team**: 17.7% automation (28/158 cases) - Large volume with low automation

### High Volume Stories
1. **GET-62908 (Vanguards)**: 59 test cases - Invoice AI Payloads
2. **GET-56987 (Vanguards)**: 29 test cases - ASVS Unicode passwords
3. **GET-64675 (Vanguards)**: 27 test cases - Citation transformation

---

## Missing Test Cases Analysis

**Expected Total (from dashboard):** 281 test cases  
**Actual Total (found in qTest):** 253 test cases  
**Missing:** 28 test cases (10% gap)

### Possible Reasons:
1. Test cases not yet created in qTest
2. Test cases in different PI folders (PI4, PI2, etc.)
3. Test cases in other sprint versions (e.g., Sprint 26.1.2)
4. Dashboard includes test cases from multiple sprints
5. Some stories may not require test cases (N/A marked)

---

## Recommendations

### Immediate Actions:
1. **Chubb & Chargers**: Evaluate automation candidates for their 22 manual test cases
2. **Vanguards**: Focus on automating GET-64675 and GET-56987 modules (56 manual cases)
3. **All Teams**: Investigate and create the 28 missing test cases

### Strategic Improvements:
1. Target overall automation rate of 30-40% for Sprint 26.1.1
2. Prioritize automation for regression-prone areas (e.g., search functionality)
3. Leverage Tosca for UI-heavy test scenarios
4. Focus on API/backend automation for payload and data validation tests

---

## Module IDs Reference

| Team | Sprint Module ID | Parent ID |
|------|-----------------|-----------|
| Vanguards | 68182935 | 68180763 |
| Nexus | 68053478 | 68180762 |
| Chubb | 68181234 | 68180759 |
| Matrix | 68185952 | 68180758 |
| Chargers | 68189033 | 68180760 |
| Mavericks | 68195893 | 68180761 |

---

**Report prepared by:** Automated Test Case Analysis  
**Project:** T360 Web and OC (Project ID: 114345)  
**Environment:** qtestnet.com
