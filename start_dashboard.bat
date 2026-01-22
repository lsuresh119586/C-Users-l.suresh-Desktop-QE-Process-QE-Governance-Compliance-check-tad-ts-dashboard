@echo off
cd /d "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\tad-ts-dashboard"
"c:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\.venv\Scripts\python.exe" -m streamlit run interactive_dashboard.py --server.port 8501 --server.address 0.0.0.0
pause