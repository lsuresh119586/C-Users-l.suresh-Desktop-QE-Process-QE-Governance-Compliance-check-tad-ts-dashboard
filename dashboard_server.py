#!/usr/bin/env python3
"""
Live Test Strategy Dashboard Server
Hosts dashboards and auto-refreshes from JIRA on schedule
"""

import http.server
import socketserver
import threading
import time
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Configuration
PORT = 8080  # Change this if port is already in use
REFRESH_INTERVAL_MINUTES = 30  # How often to refresh from JIRA
DASHBOARD_DIR = Path(__file__).parent

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve dashboard files"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD_DIR), **kwargs)
    
    def end_headers(self):
        # Add cache control headers to ensure fresh content
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom logging"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

class DashboardServer:
    """Dashboard server with auto-refresh capability"""
    
    def __init__(self, port=PORT, refresh_minutes=REFRESH_INTERVAL_MINUTES):
        self.port = port
        self.refresh_interval = refresh_minutes * 60  # Convert to seconds
        self.server = None
        self.refresh_thread = None
        self.running = False
        
    def refresh_data(self):
        """Regenerate reports from JIRA"""
        print(f"\n{'='*80}")
        print(f"🔄 Refreshing dashboard data from JIRA...")
        print(f"{'='*80}")
        
        try:
            # Run sprint report generator
            print("📊 Generating sprint report...")
            subprocess.run(
                [sys.executable, "sprint-tad-ts-report.py"],
                cwd=DASHBOARD_DIR,
                check=True
            )
            
            # Run test strategy quality analysis
            print("📊 Analyzing test strategy quality...")
            subprocess.run(
                [sys.executable, "analyze-ts-quality.py"],
                cwd=DASHBOARD_DIR,
                check=True
            )
            
            # Generate standalone HTML dashboards
            print("📊 Generating standalone dashboards...")
            subprocess.run(
                [sys.executable, "generate-standalone-html.py"],
                cwd=DASHBOARD_DIR,
                check=True
            )
            
            # Cleanup old files
            print("🧹 Cleaning up old versions...")
            subprocess.run(
                [sys.executable, "cleanup_old_files.py"],
                cwd=DASHBOARD_DIR,
                check=True
            )
            
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"\n✅ Dashboard refreshed successfully at {timestamp}")
            print(f"📍 Next refresh in {self.refresh_interval // 60} minutes")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Error refreshing dashboard: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    
    def auto_refresh_loop(self):
        """Background thread that refreshes data periodically"""
        print(f"🔄 Auto-refresh enabled: Every {self.refresh_interval // 60} minutes")
        
        # Initial refresh
        self.refresh_data()
        
        # Periodic refresh
        while self.running:
            time.sleep(self.refresh_interval)
            if self.running:  # Check again before refresh
                self.refresh_data()
    
    def start(self):
        """Start the dashboard server"""
        self.running = True
        
        print(f"\n{'='*80}")
        print(f"🚀 Starting Test Strategy Dashboard Server")
        print(f"{'='*80}")
        print(f"📍 Server URL: http://localhost:{self.port}")
        print(f"📍 Network URL: http://{self.get_local_ip()}:{self.port}")
        print(f"🔄 Auto-refresh: Every {self.refresh_interval // 60} minutes")
        print(f"{'='*80}\n")
        
        # Get latest files dynamically
        latest_files = self.get_latest_dashboards()
        
        print("📋 Available Dashboards:")
        for name, url in latest_files:
            print(f"  • {name}: {url}")
        
        print(f"\n{'='*80}")
        print(f"💡 Share the Network URL with your team to access the dashboard")
        print(f"💡 Press Ctrl+C to stop the server")
        print(f"{'='*80}\n")
        
        # Start auto-refresh in background thread
        self.refresh_thread = threading.Thread(target=self.auto_refresh_loop, daemon=True)
        self.refresh_thread.start()
        
        # Start HTTP server
        try:
            with socketserver.TCPServer(("", self.port), DashboardHandler) as httpd:
                self.server = httpd
                print(f"✅ Server started successfully!\n")
                httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Shutting down server...")
            self.running = False
        except OSError as e:
            if e.errno == 10048:  # Port already in use on Windows
                print(f"❌ Error: Port {self.port} is already in use")
                print(f"💡 Try changing the PORT in the script or close the application using this port")
            else:
                print(f"❌ Error starting server: {e}")
    
    def get_local_ip(self):
        """Get local IP address for network access"""
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "localhost"
    
    def get_latest_dashboards(self):
        """Get list of latest dashboard files (no old versions)"""
        import glob
        
        dashboards = []
        
        # Main dashboards (always show)
        main_files = [
            ("Main Dashboard", "tad-ts-dashboard.html"),
            ("Team Dashboard", "team-dashboard.html"),
        ]
        
        for name, filename in main_files:
            filepath = DASHBOARD_DIR / filename
            if filepath.exists():
                dashboards.append((name, f"http://localhost:{self.port}/{filename}"))
        
        # Latest sprint standalone
        sprint_files = sorted(DASHBOARD_DIR.glob("sprint-*-standalone.html"), reverse=True)
        if sprint_files:
            latest_sprint = sprint_files[0].name
            sprint_name = latest_sprint.replace("-standalone.html", "").replace("sprint-", "Sprint ")
            dashboards.append((f"{sprint_name} Report", f"http://localhost:{self.port}/{latest_sprint}"))
        
        # Latest test quality analysis HTML
        quality_html = sorted(DASHBOARD_DIR.glob("ts_quality_analysis_*.html"), reverse=True)
        if quality_html:
            latest_quality = quality_html[0].name
            dashboards.append(("Test Quality Analysis (HTML)", f"http://localhost:{self.port}/{latest_quality}"))
        
        # Latest test quality analysis MD
        quality_md = sorted(DASHBOARD_DIR.glob("ts_quality_analysis_*.md"), reverse=True)
        if quality_md:
            latest_quality_md = quality_md[0].name
            dashboards.append(("Test Quality Report (Markdown)", f"http://localhost:{self.port}/{latest_quality_md}"))
        
        # Latest team reports
        team_reports = sorted(DASHBOARD_DIR.glob("team_reports_*.md"), reverse=True)
        if team_reports:
            latest_team = team_reports[0].name
            dashboards.append(("Detailed Team Reports", f"http://localhost:{self.port}/{latest_team}"))
        
        return dashboards

def main():
    """Main entry point"""
    # Check if required files exist
    required_files = [
        "sprint-tad-ts-report.py",
        "analyze-ts-quality.py",
    ]
    
    missing_files = [f for f in required_files if not (DASHBOARD_DIR / f).exists()]
    if missing_files:
        print(f"❌ Error: Required files missing: {', '.join(missing_files)}")
        return
    
    # Start server
    server = DashboardServer(port=PORT, refresh_minutes=REFRESH_INTERVAL_MINUTES)
    server.start()

if __name__ == "__main__":
    main()
