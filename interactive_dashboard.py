import streamlit as st
import pandas as pd
import json
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path

# Load data
@st.cache_data
def load_data():
    data_path = Path(__file__).parent / "tad-ts-report-data.json"
    with open(data_path, 'r') as f:
        return json.load(f)

data = load_data()

# Title
st.title("TAD/TS Compliance Dashboard")
st.subheader(f"Date Range: {data['dateRange']}")
st.caption(f"Generated: {data['generated']}")

# Summary Section
st.header("📊 Summary Statistics")

summary = data['summary']
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Total Issues", summary['total'])
    st.metric("TAD Complete", f"{summary['tadComplete']} ({summary['tadPct']:.1f}%)")

with col2:
    st.metric("TS Complete", f"{summary['tsComplete']} ({summary['tsPct']:.1f}%)")
    st.metric("Both Complete", f"{summary['bothComplete']} ({summary['bothPct']:.1f}%)")

with col3:
    st.metric("Missing TAD", f"{summary['missingTad']} ({summary['missingTadPct']:.1f}%)")
    st.metric("TAD N/A", f"{summary['tadNA']} ({summary['tadNAPct']:.1f}%)")

with col4:
    st.metric("Missing TS", f"{summary['missingTs']} ({summary['missingTsPct']:.1f}%)")
    st.metric("TS N/A", f"{summary['tsNA']} ({summary['tsNAPct']:.1f}%)")

# Compliance Chart
st.subheader("Compliance Overview")
compliance_data = {
    'Category': ['TAD Complete', 'TS Complete', 'Both Complete', 'Missing TAD', 'Missing TS', 'TAD N/A', 'TS N/A'],
    'Count': [summary['tadComplete'], summary['tsComplete'], summary['bothComplete'],
              summary['missingTad'], summary['missingTs'], summary['tadNA'], summary['tsNA']],
    'Percentage': [summary['tadPct'], summary['tsPct'], summary['bothPct'],
                   summary['missingTadPct'], summary['missingTsPct'], summary['tadNAPct'], summary['tsNAPct']]
}

fig = px.bar(compliance_data, x='Category', y='Count', text='Percentage',
             title="Compliance Status", color='Category')
fig.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
st.plotly_chart(fig, use_container_width=True)

# Defects Section
st.header("🐛 Defects Analysis")

defects = data['defects']
st.metric("Total Defects", defects['totalDefects'])

# Activities Chart
activities_df = pd.DataFrame(list(defects['activities'].items()), columns=['Activity', 'Count'])
fig_activities = px.pie(activities_df, values='Count', names='Activity',
                        title="Defects by Activity")
st.plotly_chart(fig_activities, use_container_width=True)

# Team Matrix
st.subheader("Defects by Team and Activity")
team_matrix = defects['teamMatrix']
teams = list(team_matrix.keys())
activities = defects['activityNames']

matrix_data = []
for team in teams:
    for activity in activities:
        count = team_matrix[team].get(activity, 0)
        matrix_data.append({'Team': team, 'Activity': activity, 'Count': count})

matrix_df = pd.DataFrame(matrix_data)
fig_matrix = px.bar(matrix_df, x='Team', y='Count', color='Activity',
                    title="Team-Activity Defect Matrix", barmode='stack')
st.plotly_chart(fig_matrix, use_container_width=True)

# Teams Section
st.header("👥 Team Compliance Details")

teams_data = data['teams']
team_names = list(teams_data.keys())

# Team selector
selected_team = st.selectbox("Select Team", team_names)

if selected_team:
    team_info = teams_data[selected_team]
    st.subheader(f"Team: {selected_team}")

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Total Issues", team_info['total'])
        st.metric("TAD Complete", f"{team_info['tadComplete']} ({team_info['tadPct']:.1f}%)")
        st.metric("TS Complete", f"{team_info['tsComplete']} ({team_info['tsPct']:.1f}%)")

    with col2:
        st.metric("Both Complete", f"{team_info['bothComplete']} ({team_info['bothPct']:.1f}%)")
        st.metric("Missing TAD", team_info['missingTad'])
        st.metric("Missing TS", team_info['missingTs'])

    # Issues table
    st.subheader("Issues")
    issues = team_info['issues']
    if issues:
        issues_df = pd.DataFrame(issues)
        # Add status filter
        status_filter = st.multiselect("Filter by Status",
                                       options=issues_df['status'].unique(),
                                       default=issues_df['status'].unique())
        filtered_df = issues_df[issues_df['status'].isin(status_filter)]

        st.dataframe(filtered_df[['key', 'summary', 'type', 'status', 'tadFound', 'tsFound', 'totalPrs']],
                     use_container_width=True)
    else:
        st.info("No issues found for this team.")

# Defect Details
st.header("📋 Defect Details")

# Team selector for defects
defect_team = st.selectbox("Select Team for Defect Details", teams, key='defect_team')

if defect_team:
    team_defects = defects['teamDefectDetails'].get(defect_team, {})
    for activity, defect_list in team_defects.items():
        if defect_list:
            st.subheader(f"{activity} ({len(defect_list)} defects)")
            for defect in defect_list:
                st.write(f"- **{defect['key']}**: {defect['summary']}")

# Footer
st.markdown("---")
st.caption("Interactive TAD/TS Compliance Dashboard - Built with Streamlit")