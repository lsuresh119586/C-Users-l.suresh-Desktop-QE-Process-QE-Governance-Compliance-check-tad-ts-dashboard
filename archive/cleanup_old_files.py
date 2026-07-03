"""
Cleanup old dashboard files and keep only the latest versions
"""

import os
from pathlib import Path
from datetime import datetime, timedelta

DASHBOARD_DIR = Path(__file__).parent

def cleanup_old_files():
    """Remove old timestamped files, keep only latest"""
    
    print("🧹 Cleaning up old dashboard files...")
    
    # File patterns to clean up (keep only latest)
    patterns = [
        "ts_quality_analysis_*.html",
        "ts_quality_analysis_*.md",
        "team-compliance-report_*.csv",
    ]
    
    total_deleted = 0
    total_kept = 0
    
    for pattern in patterns:
        files = sorted(DASHBOARD_DIR.glob(pattern), reverse=True)
        
        if len(files) > 1:
            # Keep the latest file
            latest = files[0]
            total_kept += 1
            print(f"  ✅ Keeping: {latest.name}")
            
            # Delete older versions
            for old_file in files[1:]:
                try:
                    old_file.unlink()
                    total_deleted += 1
                    print(f"  🗑️  Deleted: {old_file.name}")
                except Exception as e:
                    print(f"  ❌ Failed to delete {old_file.name}: {e}")
        elif len(files) == 1:
            total_kept += 1
            print(f"  ✅ Keeping: {files[0].name}")
    
    print(f"\n📊 Summary:")
    print(f"  • Files kept: {total_kept}")
    print(f"  • Files deleted: {total_deleted}")
    print(f"  • Space saved: ~{total_deleted * 0.5:.1f} MB (estimated)")

if __name__ == "__main__":
    cleanup_old_files()
