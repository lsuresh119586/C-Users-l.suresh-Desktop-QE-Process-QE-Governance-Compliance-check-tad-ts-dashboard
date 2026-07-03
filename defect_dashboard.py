import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.title("Defect Analysis Dashboard")
st.subheader("Categorization by Modules with Pattern Charts")

@st.cache_data
def load_data():
    df = pd.read_csv("defects_data.csv")
    return df

df = load_data()

st.write(f"Total Defects: {len(df)}")

# Clean Modules column - remove extra spaces and handle empty values
df['Modules'] = df['Modules'].str.strip()
df['Modules'] = df['Modules'].fillna('Unknown')

# Group by Modules and count
module_counts = df['Modules'].value_counts().reset_index()
module_counts.columns = ['Module', 'Count']

st.header("📊 Module Distribution")

# Bar Chart
fig_bar = px.bar(module_counts, x='Module', y='Count',
                 title="Defects by Module",
                 color='Count',
                 color_continuous_scale='Reds')
fig_bar.update_layout(xaxis_tickangle=-45)
st.plotly_chart(fig_bar, use_container_width=True)

# Pie Chart
fig_pie = px.pie(module_counts, values='Count', names='Module',
                 title="Defect Distribution by Module")
st.plotly_chart(fig_pie, use_container_width=True)

# Top 10 modules
st.header("🏆 Top 10 Modules by Defect Count")
top_10 = module_counts.head(10)
st.dataframe(top_10, use_container_width=True)

# Additional analysis
st.header("🔍 Detailed Analysis")

col1, col2 = st.columns(2)

with col1:
    st.metric("Total Modules", len(module_counts))
    st.metric("Most Affected Module", module_counts.iloc[0]['Module'])

with col2:
    avg_defects = module_counts['Count'].mean()
    st.metric("Average Defects per Module", f"{avg_defects:.1f}")
    max_defects = module_counts['Count'].max()
    st.metric("Max Defects in a Module", max_defects)

# Status distribution by module
st.header("📈 Status Distribution by Module")

# Select a module to drill down
selected_module = st.selectbox("Select Module for Status Analysis",
                               options=module_counts['Module'].tolist())

if selected_module:
    module_data = df[df['Modules'] == selected_module]
    status_counts = module_data['Status'].value_counts().reset_index()
    status_counts.columns = ['Status', 'Count']

    fig_status = px.bar(status_counts, x='Status', y='Count',
                       title=f"Status Distribution for {selected_module}",
                       color='Status')
    st.plotly_chart(fig_status, use_container_width=True)

    # Show sample issues
    st.subheader(f"Sample Issues in {selected_module}")
    sample_issues = module_data[['Issue key', 'Summary', 'Status', 'Priority']].head(5)
    st.dataframe(sample_issues, use_container_width=True)

# Severity analysis
st.header("⚠️ Severity Analysis by Module")

severity_module = df.groupby(['Modules', 'Severity']).size().reset_index(name='Count')
severity_pivot = severity_module.pivot(index='Modules', columns='Severity', values='Count').fillna(0)

# Top modules by severity
st.subheader("Modules with Highest SEV-1 Issues")
sev1_data = severity_module[severity_module['Severity'] == 'SEV-1'].sort_values('Count', ascending=False)
st.dataframe(sev1_data.head(10), use_container_width=True)

# Monthly trends (if Month reported is available)
if 'Month reported' in df.columns:
    st.header("📅 Monthly Defect Trends")
    monthly_data = df['Month reported'].value_counts().reset_index()
    monthly_data.columns = ['Month', 'Count']
    monthly_data = monthly_data.sort_values('Month')

    fig_monthly = px.line(monthly_data, x='Month', y='Count',
                         title="Defects Reported by Month")
    st.plotly_chart(fig_monthly, use_container_width=True)

st.markdown("---")
st.caption("Defect Analysis Dashboard - Built with Streamlit")