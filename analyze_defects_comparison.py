import csv
from collections import defaultdict

# Read CSV file
defects_26_1_1 = defaultdict(int)
defects_26_1_2 = defaultdict(int)
total_26_1_1 = 0
total_26_1_2 = 0
jan_issues = []
feb_mar_issues = []

with open('defects_data.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        month = row.get('Month reported', '').strip()
        defect_type = row.get('Defect Type', 'Unknown').strip()
        issue_key = row.get('Issue key', 'Unknown').strip()
        
        # Sprint 26.1.1 - Jan 2025
        if month == 'Jan-25':
            defects_26_1_1[defect_type] += 1
            total_26_1_1 += 1
            jan_issues.append(issue_key)
        # Sprint 26.1.2 - Feb-Mar 2025
        elif month in ['Feb-25', 'Mar-25']:
            defects_26_1_2[defect_type] += 1
            total_26_1_2 += 1
            feb_mar_issues.append(issue_key)

print("="*80)
print("DEFECT TYPE COMPARISON: Sprint 26.1.1 vs Sprint 26.1.2")
print("="*80)
print()

print(f"Sprint 26.1.1 (Jan-25): {total_26_1_1} total defects")
print(f"Issues: {', '.join(jan_issues)}")
print("-" * 80)
for defect_type, count in sorted(defects_26_1_1.items(), key=lambda x: x[1], reverse=True):
    percentage = (count / total_26_1_1 * 100) if total_26_1_1 > 0 else 0
    print(f"  {defect_type:45} {count:3} ({percentage:5.1f}%)")

print()
print(f"Sprint 26.1.2 (Feb-Mar 25): {total_26_1_2} total defects")
print(f"Sample Issues (first 10): {', '.join(feb_mar_issues[:10])}")
print("-" * 80)
for defect_type, count in sorted(defects_26_1_2.items(), key=lambda x: x[1], reverse=True):
    percentage = (count / total_26_1_2 * 100) if total_26_1_2 > 0 else 0
    print(f"  {defect_type:45} {count:3} ({percentage:5.1f}%)")

print()
print("COMPARISON BY DEFECT TYPE:")
print("-" * 80)
print(f"{'Defect Type':<45} {'26.1.1':>8} {'26.1.2':>8} {'Change':>8}")
print("-" * 80)

all_types = set(defects_26_1_1.keys()) | set(defects_26_1_2.keys())
for defect_type in sorted(all_types):
    count_1 = defects_26_1_1.get(defect_type, 0)
    count_2 = defects_26_1_2.get(defect_type, 0)
    change = count_2 - count_1
    change_str = f"{change:+d}" if change != 0 else "0"
    print(f"{defect_type:<45} {count_1:8} {count_2:8} {change_str:>8}")

print("-" * 80)
print(f"{'TOTAL':<45} {total_26_1_1:8} {total_26_1_2:8} {total_26_1_2 - total_26_1_1:+8}")
print("="*80)
