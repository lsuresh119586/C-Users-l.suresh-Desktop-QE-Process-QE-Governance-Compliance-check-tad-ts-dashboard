# TAD/TS Compliance Dashboard - Sharing Guide

## 📤 How to Share This Dashboard

### ✅ **Option 1: Single File (Easiest)**

Share the standalone HTML file - everything is embedded in one file!

**Files to share:**
- `sprint-26.1.1-standalone.html` (created for you)

**Instructions for recipients:**
1. Download the HTML file
2. Double-click to open in any web browser (Chrome, Edge, Firefox)
3. View fully interactive dashboard with all features

**Advantages:**
- ✅ Only ONE file to share
- ✅ No setup required
- ✅ Works offline
- ✅ All data embedded
- ✅ Perfect for email attachments or Slack/Teams

---

### 📁 **Option 2: Two Files (Original)**

Share the original dashboard with separate data file.

**Files to share:**
- `sprint-26.1.1-management-dashboard.html`
- `tad-ts-report-data.js`

**Instructions for recipients:**
1. Download BOTH files to the SAME folder
2. Open the HTML file in a browser
3. Dashboard will load the data automatically

**Advantages:**
- ✅ Smaller file sizes
- ✅ Easy to update data separately
- ✅ Good for frequent updates

---

### 🌐 **Option 3: SharePoint/OneDrive (For Teams)**

**Setup:**
1. Upload to SharePoint document library or OneDrive
2. Share the link with view permissions
3. Recipients can open HTML directly in browser

**Path examples:**
```
SharePoint: https://yourcompany.sharepoint.com/sites/QE/Dashboards/sprint-26.1.1-standalone.html
OneDrive: https://yourcompany-my.sharepoint.com/personal/your_name/Documents/Dashboards/
```

**Advantages:**
- ✅ Centralized location
- ✅ Access control via SharePoint permissions
- ✅ Version history
- ✅ No email attachments needed

---

### 📧 **Option 4: Email**

**For single file:**
```
Subject: Sprint 26.1.1 TAD/TS Compliance Dashboard

Hi Team,

Please find attached the TAD/TS compliance dashboard for Sprint 26.1.1.

Simply download and open the HTML file in your browser to view:
• Team rankings and compliance scores
• Interactive charts and metrics
• Detailed issue breakdown
• Key insights and recommendations

All data is embedded - no additional files needed!

Best regards,
[Your Name]
```

**Attachment:** `sprint-26.1.1-standalone.html`

---

### 🖨️ **Option 5: PDF (For Static Reports)**

Convert to PDF for management presentations:

1. Open the HTML file in Chrome or Edge
2. Press `Ctrl+P` (Print)
3. Choose "Save as PDF"
4. Adjust settings:
   - Layout: Landscape
   - Scale: 90% (to fit content)
   - Background graphics: ON
5. Save and share the PDF

---

### 🔄 **Option 6: Network Share (For Internal Use)**

**Setup:**
1. Place files on network drive (e.g., `\\fileserver\QE\Dashboards\`)
2. Share the path with team
3. Everyone accesses from same location

**Advantages:**
- ✅ Always up-to-date
- ✅ Single source of truth
- ✅ No email clutter

---

### 💡 **Best Practices**

**For one-time sharing:**
→ Use standalone HTML (Option 1)

**For regular updates:**
→ Use SharePoint/OneDrive (Option 3)

**For management presentations:**
→ Convert to PDF (Option 5)

**For large teams:**
→ Use network share or SharePoint (Options 3 & 6)

---

## 🔧 Updating the Data

To generate a new dashboard:

```powershell
# For specific sprint
python sprint-tad-ts-report.py sprint=26.1.2

# For date range
python sprint-tad-ts-report.py 2026-01-01 2026-01-31

# Generate standalone version
python generate-standalone-html.py
```

This creates:
- `sprint-26.1.2-management-dashboard.html` (with separate data file)
- `standalone-dashboard/tad-ts-dashboard-standalone.html` (all-in-one)

---

## 📞 Support

If you need help:
1. Check that browsers allow local file access
2. Try different browser (Chrome recommended)
3. Ensure file is downloaded completely
4. Contact QE team for assistance

---

## 📝 File Locations

**Current workspace:**
```
tad-ts-dashboard/
├── sprint-26.1.1-management-dashboard.html   (Original dashboard)
├── sprint-26.1.1-standalone.html              (Created for you)
├── tad-ts-report-data.js                      (Data file)
├── standalone-dashboard/
│   └── tad-ts-dashboard-standalone.html       (All months dashboard)
└── README-SHARING.md                          (This file)
```

**Share these files:**
- ✅ `sprint-26.1.1-standalone.html` → **Recommended** (one file, easy to share)
- OR
- `sprint-26.1.1-management-dashboard.html` + `tad-ts-report-data.js` (two files)

---

## ✨ Features

Your dashboard includes:
- 📊 8 interactive metric cards (click to view details)
- 📈 Beautiful charts and visualizations
- 🏆 Team rankings with compliance scores
- 💡 AI-powered insights and recommendations
- 🔍 Team filtering capability
- 📱 Responsive design (works on mobile)
- 🖨️ Print-friendly layout

---

*Generated: January 2026*
*TAD/TS Compliance Monitoring System*
