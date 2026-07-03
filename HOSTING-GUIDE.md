# Live Dashboard Server - Setup Guide

## 🚀 Quick Start

### Option 1: Run Locally (Immediate)
```powershell
cd "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\tad-ts-dashboard"
python dashboard_server.py
```

**Access the dashboard:**
- Local: http://localhost:8080
- Network: http://YOUR_IP_ADDRESS:8080 (shown in terminal)

### Option 2: Configure Settings

Edit `dashboard_server.py` to customize:
```python
PORT = 8080  # Change if port is in use
REFRESH_INTERVAL_MINUTES = 30  # How often to update from JIRA
```

---

## 📋 Available Dashboards

Once server is running, access:

1. **Main Dashboard**: http://localhost:8080/tad-ts-dashboard.html
2. **Sprint 26.1.1 Standalone**: http://localhost:8080/sprint-26.1.1-standalone.html
3. **Test Quality Analysis**: http://localhost:8080/ts_quality_analysis_20260112_161552.html
4. **Team Reports (Markdown)**: http://localhost:8080/team_reports_sprint_26.1.1.md

---

## 🔄 Auto-Refresh Features

- **Automatic Updates**: Dashboard refreshes from JIRA every 30 minutes (configurable)
- **Real-time Data**: Always shows latest test strategy compliance
- **No Manual Steps**: Just keep the server running

---

## 🌐 Sharing with Team

### Method 1: Local Network Access
1. Start the server
2. Note the Network URL displayed (e.g., http://192.168.1.100:8080)
3. Share this URL with your team
4. Anyone on the same network can access it

### Method 2: Firewall Configuration (if blocked)
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Dashboard Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### Method 3: Cloud Hosting (for external access)

#### Using ngrok (Easiest):
```powershell
# Download ngrok from https://ngrok.com/download
ngrok http 8080
```
This provides a public URL like: https://abc123.ngrok.io

---

## 🔧 Windows Service Setup (Keep Running 24/7)

### Option A: Task Scheduler (Recommended)

1. **Create Batch File**: `start_dashboard.bat`
```batch
@echo off
cd "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\tad-ts-dashboard"
python dashboard_server.py
```

2. **Open Task Scheduler**: Win + R → `taskschd.msc`

3. **Create Task**:
   - General tab:
     - Name: "Dashboard Server"
     - Run whether user is logged on or not
   - Triggers tab:
     - At startup
   - Actions tab:
     - Start a program
     - Program: `C:\Windows\System32\cmd.exe`
     - Arguments: `/c "C:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\tad-ts-dashboard\start_dashboard.bat"`
   - Conditions: Uncheck "Start only if on AC power"

### Option B: NSSM (Non-Sucking Service Manager)

1. **Download NSSM**: https://nssm.cc/download
2. **Install Service**:
```powershell
nssm install DashboardServer "C:\Python\python.exe" "C:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\tad-ts-dashboard\dashboard_server.py"
nssm start DashboardServer
```

---

## 🏢 Enterprise Hosting Options

### Option 1: IIS Hosting (Windows Server)

1. **Install Python CGI Handler**
2. **Create IIS Site**:
   - Point to dashboard directory
   - Add Python handler
   - Configure port 80/443

### Option 2: Azure/AWS Hosting

**Azure App Service**:
```powershell
# Install Azure CLI
az webapp create --name ts-dashboard --resource-group myResourceGroup --runtime "PYTHON:3.11"
az webapp deployment source config-local-git --name ts-dashboard --resource-group myResourceGroup
git push azure master
```

**AWS EC2**:
- Launch EC2 instance (t2.micro free tier)
- Install Python
- Upload dashboard files
- Run `python dashboard_server.py`
- Configure Security Group to allow port 8080

### Option 3: Docker Container

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install requests
EXPOSE 8080
CMD ["python", "dashboard_server.py"]
```

Build and run:
```powershell
docker build -t ts-dashboard .
docker run -d -p 8080:8080 ts-dashboard
```

---

## 🔒 Security Considerations

### 1. Add Authentication (Optional)

Edit `dashboard_server.py` to add basic auth:
```python
import base64

class AuthHandler(DashboardHandler):
    def do_GET(self):
        auth_header = self.headers.get('Authorization')
        if auth_header:
            auth_type, credentials = auth_header.split(' ')
            decoded = base64.b64decode(credentials).decode()
            username, password = decoded.split(':')
            if username == "admin" and password == "yourpassword":
                return super().do_GET()
        
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="Dashboard"')
        self.end_headers()
```

### 2. HTTPS Setup

Use reverse proxy (nginx/IIS) with SSL certificate

### 3. VPN Access

Require VPN connection to access dashboard

---

## 📊 Monitoring

### Check Server Status
```powershell
# Check if port is listening
netstat -ano | findstr :8080

# View logs in terminal
# Server logs all requests with timestamps
```

### Restart Server
```powershell
# If using Task Scheduler
Get-ScheduledTask -TaskName "Dashboard Server" | Start-ScheduledTask

# If using NSSM
nssm restart DashboardServer
```

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :8080

# Kill process (replace PID)
taskkill /F /PID <PID>
```

### Can't Access from Network
- Check Windows Firewall
- Verify network connectivity
- Ensure server is listening on 0.0.0.0 (not 127.0.0.1)

### JIRA Updates Not Working
- Check JIRA credentials in scripts
- Verify network access to JIRA
- Check error logs in terminal

---

## 📱 Mobile Access

The dashboards are responsive and work on mobile devices. Just access the same URL from your phone/tablet.

---

## 🔧 Customization

### Change Refresh Interval
Edit `dashboard_server.py`:
```python
REFRESH_INTERVAL_MINUTES = 15  # Refresh every 15 minutes
```

### Add Custom Dashboards
Place any HTML files in the dashboard directory - they'll be automatically served.

### Webhook Integration (Advanced)
Add JIRA webhook to trigger immediate refresh:
```python
# Add webhook endpoint
if self.path == '/webhook/refresh':
    threading.Thread(target=self.refresh_data).start()
    self.send_response(200)
```

---

## 📞 Support

For issues or questions:
1. Check server logs in terminal
2. Verify JIRA connectivity
3. Test scripts individually:
   - `python sprint-tad-ts-report.py`
   - `python analyze-ts-quality.py`

---

## 📝 Quick Reference

| Action | Command |
|--------|---------|
| Start Server | `python dashboard_server.py` |
| Access Locally | http://localhost:8080 |
| Stop Server | Ctrl + C |
| Check Status | `netstat -ano \| findstr :8080` |
| View on Network | http://YOUR_IP:8080 |

---

**Last Updated**: January 12, 2026
