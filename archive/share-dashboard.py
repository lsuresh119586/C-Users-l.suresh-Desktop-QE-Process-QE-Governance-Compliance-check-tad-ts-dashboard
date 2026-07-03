#!/usr/bin/env python3
"""Quick script to copy files to SharePoint or network location"""

import shutil
import os
from datetime import datetime

# Configuration - UPDATE THESE PATHS
SHAREPOINT_PATH = r"\\sharepoint\QE\Dashboards"  # Update with your SharePoint sync folder
NETWORK_SHARE = r"\\fileserver\QE\Dashboards"   # Update with your network share

def copy_to_location(source_file, destination_folder, location_name):
    """Copy file to specified location"""
    try:
        if not os.path.exists(destination_folder):
            print(f"⚠️  {location_name} folder not found: {destination_folder}")
            print(f"   Please update the path in this script or create the folder manually.")
            return False
        
        dest_file = os.path.join(destination_folder, os.path.basename(source_file))
        shutil.copy2(source_file, dest_file)
        print(f"✅ Copied to {location_name}: {dest_file}")
        return True
    except Exception as e:
        print(f"❌ Error copying to {location_name}: {str(e)}")
        return False

def main():
    """Main execution"""
    print("="*80)
    print("TAD/TS Dashboard - File Distribution")
    print("="*80)
    print()
    
    # Files to copy
    files = [
        "sprint-26.1.1-standalone.html",
        "sprint-26.1.1-management-dashboard.html",
        "tad-ts-report-data.js"
    ]
    
    print("Files ready for distribution:")
    for f in files:
        if os.path.exists(f):
            size = os.path.getsize(f) / 1024
            print(f"  ✓ {f} ({size:.1f} KB)")
        else:
            print(f"  ✗ {f} (not found)")
    print()
    
    # Option to copy to locations
    print("Choose distribution method:")
    print("  1. Copy to SharePoint")
    print("  2. Copy to Network Share")
    print("  3. Create email draft")
    print("  4. Just show file locations (manual copy)")
    print()
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == "1":
        print("\nCopying to SharePoint...")
        for f in files:
            if os.path.exists(f):
                copy_to_location(f, SHAREPOINT_PATH, "SharePoint")
    
    elif choice == "2":
        print("\nCopying to Network Share...")
        for f in files:
            if os.path.exists(f):
                copy_to_location(f, NETWORK_SHARE, "Network Share")
    
    elif choice == "3":
        print("\nEmail template generated!")
        print()
        print("-" * 80)
        print("Subject: Sprint 26.1.1 TAD/TS Compliance Dashboard")
        print()
        print("Hi Team,")
        print()
        print("Please find attached the TAD/TS compliance dashboard for Sprint 26.1.1.")
        print()
        print("📊 Quick Summary:")
        print("• TAD Compliance: 100% (21/21 applicable)")
        print("• TS Compliance: 90.5% (19/21 applicable)")
        print("• Total Issues: 23 across 6 teams")
        print()
        print("Simply download and open the HTML file in your browser to view:")
        print("✓ Interactive charts and metrics")
        print("✓ Team rankings and compliance scores")
        print("✓ Detailed issue breakdown")
        print("✓ Key insights and recommendations")
        print()
        print("All data is embedded - no additional files needed!")
        print()
        print("Best regards,")
        print()
        print("-" * 80)
        print()
        print("Attach: sprint-26.1.1-standalone.html")
    
    elif choice == "4":
        print("\n📁 File Locations:")
        current_dir = os.getcwd()
        for f in files:
            if os.path.exists(f):
                full_path = os.path.join(current_dir, f)
                print(f"  {f}")
                print(f"    → {full_path}")
        print()
        print("Copy these files manually to your desired location.")
    
    else:
        print("Invalid choice. Showing file locations...")
        current_dir = os.getcwd()
        for f in files:
            if os.path.exists(f):
                print(f"  {os.path.join(current_dir, f)}")
    
    print()
    print("="*80)
    print("For more sharing options, see README-SHARING.md")
    print("="*80)

if __name__ == "__main__":
    main()
