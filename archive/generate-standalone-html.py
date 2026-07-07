"""
Generate standalone TAD/TS Dashboard HTML with embedded data
This creates a single HTML file that can be shared without external dependencies
"""

import json
import os

def read_all_month_data():
    """Read all month data files"""
    months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', 
              '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12']
    
    month_data = {}
    for month in months:
        json_file = f'tad-ts-report-{month}.json'
        if os.path.exists(json_file):
            with open(json_file, 'r', encoding='utf-8') as f:
                month_data[month] = json.load(f)
            print(f'✓ Loaded {month}')
        else:
            print(f'✗ Missing {month}')
    
    return month_data

def generate_standalone_html(month_data):
    """Generate standalone HTML with embedded data"""
    
    # Convert month data to JavaScript
    embedded_data_js = "const EMBEDDED_DATA = " + json.dumps(month_data, indent=2) + ";"
    
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TAD/TS Compliance Dashboard (Standalone)</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 10px;
            min-height: 100vh;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        .header {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 15px;
        }}

        .header h1 {{
            color: #333;
            font-size: 22px;
            margin-bottom: 5px;
        }}

        .header .meta {{
            color: #666;
            font-size: 14px;
        }}

        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }}

        .metric-card {{
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        .metric-card .label {{
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 8px;
        }}

        .metric-card .value {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }}

        .metric-card .percentage {{
            font-size: 14px;
            color: #999;
            margin-left: 5px;
        }}

        .metric-card.success .value {{ color: #10b981; }}
        .metric-card.warning .value {{ color: #f59e0b; }}
        .metric-card.danger .value {{ color: #ef4444; }}

        .charts-section {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }}

        .chart-card {{
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        .chart-card h2 {{
            color: #333;
            font-size: 16px;
            margin-bottom: 10px;
        }}

        .chart-card canvas {{
            max-height: 250px;
        }}

        .teams-section {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 15px;
        }}

        .teams-section h2 {{
            color: #333;
            font-size: 18px;
            margin-bottom: 12px;
        }}

        .team-card {{
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
        }}

        .team-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            cursor: pointer;
        }}

        .team-name {{
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }}

        .team-stats {{
            display: flex;
            gap: 20px;
            font-size: 14px;
        }}

        .stat {{
            display: flex;
            flex-direction: column;
            align-items: center;
        }}

        .stat .label {{
            color: #666;
            font-size: 11px;
            text-transform: uppercase;
        }}

        .stat .value {{
            font-weight: bold;
            color: #333;
        }}

        .team-details {{
            display: none;
            margin-top: 15px;
            overflow-x: auto;
        }}

        .team-details.active {{
            display: block;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }}

        th {{
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }}

        td {{
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }}

        tr:hover {{
            background: #f9fafb;
        }}

        .badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }}

        .badge.success {{
            background: #d1fae5;
            color: #065f46;
        }}

        .badge.danger {{
            background: #fee2e2;
            color: #991b1b;
        }}

        .progress-bar {{
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }}

        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s;
        }}

        .refresh-info {{
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 12px;
        }}

        .filter-section {{
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }}

        .filter-section label {{
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }}

        .filter-section select {{
            padding: 8px 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            min-width: 120px;
        }}

        .filter-section select:focus {{
            outline: none;
            border-color: #667eea;
        }}

        .standalone-badge {{
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: auto;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TAD/TS Compliance Dashboard <span class="standalone-badge">Standalone Version</span></h1>
            <div class="meta">
                <span id="dateRange">Loading...</span> | 
                <span>Last Updated: <span id="lastUpdate"></span></span>
            </div>
        </div>
        
        <div class="filter-section">
            <label for="monthSelect">Select Month:</label>
            <select id="monthSelect" onchange="loadMonthData()">
                <option value="2025-12">December 2025</option>
                <option value="2025-11">November 2025</option>
                <option value="2025-10">October 2025</option>
                <option value="2025-09">September 2025</option>
                <option value="2025-08">August 2025</option>
                <option value="2025-07">July 2025</option>
                <option value="2025-06">June 2025</option>
                <option value="2025-05">May 2025</option>
                <option value="2025-04">April 2025</option>
                <option value="2025-03">March 2025</option>
                <option value="2025-02">February 2025</option>
                <option value="2025-01">January 2025</option>
            </select>
            
            <label for="statusSelect">Filter by Status:</label>
            <select id="statusSelect" onchange="applyStatusFilter()">
                <option value="all">All Statuses</option>
                <option value="Closed">Closed Only</option>
                <option value="New">New Only</option>
                <option value="Closed,New">Closed & New</option>
            </select>
        </div>

        <div class="summary-grid">
            <div class="metric-card">
                <div class="label">Total Issues</div>
                <div class="value" id="totalIssues">-</div>
            </div>
            <div class="metric-card success">
                <div class="label">TAD Complete</div>
                <div class="value" id="tadComplete">-</div>
                <span class="percentage" id="tadPct">-</span>
            </div>
            <div class="metric-card success">
                <div class="label">TS Complete</div>
                <div class="value" id="tsComplete">-</div>
                <span class="percentage" id="tsPct">-</span>
            </div>
            <div class="metric-card warning">
                <div class="label">Both Complete</div>
                <div class="value" id="bothComplete">-</div>
                <span class="percentage" id="bothPct">-</span>
            </div>
            <div class="metric-card danger">
                <div class="label">Missing TAD</div>
                <div class="value" id="missingTad">-</div>
                <span class="percentage" id="missingTadPct">-</span>
            </div>
            <div class="metric-card danger">
                <div class="label">Missing TS</div>
                <div class="value" id="missingTs">-</div>
                <span class="percentage" id="missingTsPct">-</span>
            </div>
        </div>

        <div class="charts-section">
            <div class="chart-card">
                <h2>Overall Compliance</h2>
                <canvas id="overallChart"></canvas>
            </div>
            <div class="chart-card">
                <h2>Team Comparison - TAD</h2>
                <canvas id="teamTadChart"></canvas>
            </div>
            <div class="chart-card">
                <h2>Team Comparison - TS</h2>
                <canvas id="teamTsChart"></canvas>
            </div>
        </div>

        <div class="teams-section">
            <h2>Team Details</h2>
            <div id="teamsContainer">Loading...</div>
        </div>

        <div class="refresh-info">
            Standalone Dashboard - All data embedded (no external files needed)
        </div>
    </div>

    <script>
        // Embedded data - all months included
        {embedded_data_js}
        
        let currentCharts = {{}};
        let window_reportData = null;

        // Load month data from embedded data
        function loadMonthData() {{
            const monthSelect = document.getElementById('monthSelect');
            const selectedMonth = monthSelect.value;
            
            // Destroy existing charts first
            Object.values(currentCharts).forEach(chart => {{
                try {{
                    chart.destroy();
                }} catch (e) {{
                    console.log('Chart already destroyed');
                }}
            }});
            currentCharts = {{}};
            
            // Load data from embedded data
            if (EMBEDDED_DATA[selectedMonth]) {{
                window_reportData = EMBEDDED_DATA[selectedMonth];
                console.log('Loaded data for', selectedMonth);
                updateDashboard();
            }} else {{
                document.getElementById('teamsContainer').innerHTML = 
                    `<p style="color: #ef4444;">No data available for ${{selectedMonth}}</p>`;
            }}
        }}

        function updateDashboard() {{
            if (!window_reportData) return;
            
            const reportData = window_reportData;

            // Update header
            document.getElementById('dateRange').textContent = reportData.dateRange;
            document.getElementById('lastUpdate').textContent = reportData.generated;

            // Apply status filter if selected
            applyStatusFilter();
        }}

        function applyStatusFilter() {{
            if (!window_reportData) return;
            
            const statusSelect = document.getElementById('statusSelect');
            const selectedStatus = statusSelect ? statusSelect.value : 'all';
            
            // Clone the original data
            const reportData = JSON.parse(JSON.stringify(window_reportData));
            
            // Filter issues by status if not "all"
            if (selectedStatus !== 'all') {{
                const statusList = selectedStatus.split(',');
                
                // Filter each team's issues
                for (const teamName in reportData.teams) {{
                    const team = reportData.teams[teamName];
                    const originalIssues = team.issues;
                    
                    // Filter issues by status
                    team.issues = originalIssues.filter(issue => statusList.includes(issue.status));
                    
                    // Recalculate team stats
                    team.total = team.issues.length;
                    team.tadComplete = team.issues.filter(i => i.tadFound).length;
                    team.tsComplete = team.issues.filter(i => i.tsFound).length;
                    team.bothComplete = team.issues.filter(i => i.tadFound && i.tsFound).length;
                    team.tadPct = team.total > 0 ? (team.tadComplete / team.total * 100) : 0;
                    team.tsPct = team.total > 0 ? (team.tsComplete / team.total * 100) : 0;
                }}
                
                // Remove teams with no issues after filtering
                for (const teamName in reportData.teams) {{
                    if (reportData.teams[teamName].total === 0) {{
                        delete reportData.teams[teamName];
                    }}
                }}
                
                // Recalculate overall summary
                let total = 0, tadComplete = 0, tsComplete = 0, bothComplete = 0;
                for (const teamName in reportData.teams) {{
                    const team = reportData.teams[teamName];
                    total += team.total;
                    tadComplete += team.tadComplete;
                    tsComplete += team.tsComplete;
                    bothComplete += team.bothComplete;
                }}
                
                reportData.summary.total = total;
                reportData.summary.tadComplete = tadComplete;
                reportData.summary.tsComplete = tsComplete;
                reportData.summary.bothComplete = bothComplete;
                reportData.summary.missingTad = total - tadComplete;
                reportData.summary.missingTs = total - tsComplete;
                reportData.summary.tadPct = total > 0 ? (tadComplete / total * 100) : 0;
                reportData.summary.tsPct = total > 0 ? (tsComplete / total * 100) : 0;
                reportData.summary.bothPct = total > 0 ? (bothComplete / total * 100) : 0;
                reportData.summary.missingTadPct = total > 0 ? ((total - tadComplete) / total * 100) : 0;
                reportData.summary.missingTsPct = total > 0 ? ((total - tsComplete) / total * 100) : 0;
            }}
            
            // Update summary metrics
            document.getElementById('totalIssues').textContent = reportData.summary.total;
            document.getElementById('tadComplete').textContent = reportData.summary.tadComplete;
            document.getElementById('tadPct').textContent = `${{reportData.summary.tadPct.toFixed(1)}}%`;
            document.getElementById('tsComplete').textContent = reportData.summary.tsComplete;
            document.getElementById('tsPct').textContent = `${{reportData.summary.tsPct.toFixed(1)}}%`;
            document.getElementById('bothComplete').textContent = reportData.summary.bothComplete;
            document.getElementById('bothPct').textContent = `${{reportData.summary.bothPct.toFixed(1)}}%`;
            document.getElementById('missingTad').textContent = reportData.summary.missingTad;
            document.getElementById('missingTadPct').textContent = `${{reportData.summary.missingTadPct.toFixed(1)}}%`;
            document.getElementById('missingTs').textContent = reportData.summary.missingTs;
            document.getElementById('missingTsPct').textContent = `${{reportData.summary.missingTsPct.toFixed(1)}}%`;

            // Create charts with filtered data
            createOverallChart(reportData);
            createTeamCharts(reportData);

            // Render team cards with filtered data
            renderTeams(reportData);
        }}

        function createOverallChart(reportData) {{
            reportData = reportData || window_reportData;
            const ctx = document.getElementById('overallChart').getContext('2d');
            if (currentCharts.overall) {{
                currentCharts.overall.destroy();
            }}
            currentCharts.overall = new Chart(ctx, {{
                type: 'doughnut',
                data: {{
                    labels: ['TAD Complete', 'TS Complete', 'Both Complete', 'None'],
                    datasets: [{{
                        data: [
                            reportData.summary.tadComplete - reportData.summary.bothComplete,
                            reportData.summary.tsComplete - reportData.summary.bothComplete,
                            reportData.summary.bothComplete,
                            reportData.summary.total - reportData.summary.tadComplete - reportData.summary.tsComplete + reportData.summary.bothComplete
                        ],
                        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#e5e7eb']
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{
                        legend: {{
                            position: 'bottom',
                            labels: {{
                                boxWidth: 15,
                                padding: 8,
                                font: {{
                                    size: 11
                                }}
                            }}
                        }}
                    }}
                }}
            }});
        }}

        function createTeamCharts(reportData) {{
            reportData = reportData || window_reportData;
            const teams = reportData.teams;
            const teamNames = Object.keys(teams).sort();
            
            // TAD Chart
            const tadCtx = document.getElementById('teamTadChart').getContext('2d');
            if (currentCharts.tad) {{
                currentCharts.tad.destroy();
            }}
            currentCharts.tad = new Chart(tadCtx, {{
                type: 'bar',
                data: {{
                    labels: teamNames,
                    datasets: [{{
                        label: 'TAD %',
                        data: teamNames.map(name => teams[name].tadPct),
                        backgroundColor: '#10b981'
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{
                        legend: {{
                            display: false
                        }}
                    }},
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            max: 100,
                            ticks: {{
                                font: {{
                                    size: 10
                                }}
                            }}
                        }},
                        x: {{
                            ticks: {{
                                font: {{
                                    size: 10
                                }}
                            }}
                        }}
                    }}
                }}
            }});

            // TS Chart
            const tsCtx = document.getElementById('teamTsChart').getContext('2d');
            if (currentCharts.ts) {{
                currentCharts.ts.destroy();
            }}
            currentCharts.ts = new Chart(tsCtx, {{
                type: 'bar',
                data: {{
                    labels: teamNames,
                    datasets: [{{
                        label: 'TS %',
                        data: teamNames.map(name => teams[name].tsPct),
                        backgroundColor: '#3b82f6'
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{
                        legend: {{
                            display: false
                        }}
                    }},
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            max: 100,
                            ticks: {{
                                font: {{
                                    size: 10
                                }}
                            }}
                        }},
                        x: {{
                            ticks: {{
                                font: {{
                                    size: 10
                                }}
                            }}
                        }}
                    }}
                }}
            }});
        }}

        function renderTeams(reportData) {{
            reportData = reportData || window_reportData;
            const container = document.getElementById('teamsContainer');
            const teams = reportData.teams;
            const teamNames = Object.keys(teams).sort();

            let html = '';
            teamNames.forEach(teamName => {{
                const team = teams[teamName];
                html += `
                    <div class="team-card">
                        <div class="team-header" onclick="toggleTeam('${{teamName}}')">
                            <div class="team-name">${{teamName}}</div>
                            <div class="team-stats">
                                <div class="stat">
                                    <span class="label">Total</span>
                                    <span class="value">${{team.total}}</span>
                                </div>
                                <div class="stat">
                                    <span class="label">TAD</span>
                                    <span class="value">${{team.tadComplete}} (${{team.tadPct.toFixed(1)}}%)</span>
                                </div>
                                <div class="stat">
                                    <span class="label">TS</span>
                                    <span class="value">${{team.tsComplete}} (${{team.tsPct.toFixed(1)}}%)</span>
                                </div>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${{team.tadPct}}%"></div>
                        </div>
                        <div class="team-details" id="team-${{teamName.replace(/\\s+/g, '-')}}">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Issue</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>TAD</th>
                                        <th>TS</th>
                                        <th>Summary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${{team.issues.map(issue => `
                                        <tr>
                                            <td><a href="os.environ.get("JIRA_URL","https://jira.example.com")+"/  # jira/browse/${{issue.key}}" target="_blank">${{issue.key}}</a></td>
                                            <td>${{issue.type}}</td>
                                            <td>${{issue.status}}</td>
                                            <td>${{issue.tadFound ? '<span class="badge success">✓</span>' : '<span class="badge danger">✗</span>'}}</td>
                                            <td>${{issue.tsFound ? '<span class="badge success">✓</span>' : '<span class="badge danger">✗</span>'}}</td>
                                            <td>${{issue.summary.substring(0, 60)}}${{issue.summary.length > 60 ? '...' : ''}}</td>
                                        </tr>
                                    `).join('')}}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }});

            container.innerHTML = html;
        }}

        function toggleTeam(teamName) {{
            const details = document.getElementById(`team-${{teamName.replace(/\\s+/g, '-')}}`);
            details.classList.toggle('active');
        }}

        // Load default month on page load
        loadMonthData();
    </script>
</body>
</html>
'''
    
    return html_content

def main():
    """Main function"""
    print("=" * 70)
    print("TAD/TS Dashboard - Standalone HTML Generator")
    print("=" * 70)
    print()
    
    # Read all month data
    print("Reading month data files...")
    month_data = read_all_month_data()
    print(f"\nTotal months loaded: {len(month_data)}")
    
    if not month_data:
        print("\n❌ No month data found! Please generate reports first.")
        return
    
    # Generate standalone HTML
    print("\nGenerating standalone HTML file...")
    html_content = generate_standalone_html(month_data)
    
    # Save to standalone folder
    output_dir = "standalone-dashboard"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    output_file = os.path.join(output_dir, "tad-ts-dashboard-standalone.html")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    file_size_mb = os.path.getsize(output_file) / (1024 * 1024)
    
    print(f"\n✅ Standalone HTML generated successfully!")
    print(f"   File: {output_file}")
    print(f"   Size: {file_size_mb:.2f} MB")
    print(f"   Months: {', '.join(sorted(month_data.keys()))}")
    print("\n" + "=" * 70)
    print("You can now share this single HTML file with your team!")
    print("No external files needed - everything is embedded.")
    print("=" * 70)

if __name__ == "__main__":
    main()
