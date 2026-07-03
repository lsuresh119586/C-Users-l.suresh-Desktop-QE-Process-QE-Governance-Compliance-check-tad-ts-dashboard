# Interactive TAD/TS Compliance Dashboard

This Streamlit application provides an interactive dashboard for TAD/TS compliance data.

## Prerequisites

- Python 3.12+
- Virtual environment with required packages installed

## Running the Dashboard

1. Activate the virtual environment:
   ```
   .venv\Scripts\activate
   ```

2. Run the Streamlit app:
   ```
   streamlit run interactive_dashboard.py
   ```

3. Open the URL shown in the terminal (usually http://localhost:8501)

## Features

- **Summary Statistics**: Overview of TAD/TS compliance metrics
- **Compliance Charts**: Visual representation of completion rates
- **Defects Analysis**: Breakdown of defects by activity and team
- **Team Details**: Drill-down into individual team compliance
- **Interactive Filters**: Filter issues by status and team

## Data Source

The dashboard loads data from `tad-ts-report-data.json` in the same directory.