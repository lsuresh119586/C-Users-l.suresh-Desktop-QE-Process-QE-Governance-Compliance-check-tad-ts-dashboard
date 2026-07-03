#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Run streamlit
try:
    subprocess.run([sys.executable, "-m", "streamlit", "run", "interactive_dashboard.py", "--server.port", "8501", "--server.address", "0.0.0.0"], check=True)
except subprocess.CalledProcessError as e:
    print(f"Error running streamlit: {e}")
    input("Press Enter to exit...")