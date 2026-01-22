@echo off
echo Starting Defect Analysis Dashboard...
cd /d "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Compliance check\tad-ts-dashboard"
"C:/Users/l.suresh/Desktop/QE Process/QE Governance/Compliance check/.venv/Scripts/python.exe" -m streamlit run defect_dashboard.py --server.port 8502 --server.address 0.0.0.0
pause