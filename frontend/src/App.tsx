import { useState, useEffect } from 'react';
import { Layout, Select, Card, Row, Col, Statistic, Progress, Button, Typography, Spin, Alert } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { apiService, type Product, type Team, type Sprint, type Metrics } from './services/api';
import './App.css';

const { Header, Content } = Layout;
const { Title: AntTitle } = Typography;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewLevel, setViewLevel] = useState<'organization' | 'product' | 'team' | 'sprint'>('organization');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadTeams();
    }
  }, [selectedProduct]);

  useEffect(() => {
    loadMetrics();
  }, [selectedProduct, selectedTeam, selectedSprint]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsData, sprintsData] = await Promise.all([
        apiService.getProducts(),
        apiService.getSprints()
      ]);
      setProducts(productsData);
      setSprints(sprintsData);
      
      // Load organization-wide metrics by default (Story 1)
      await loadOrganizationMetrics();
    } catch (err) {
      setError('Failed to load initial data. Please check if API server is running.');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgMetrics = await apiService.getOrganizationMetrics();
      setMetrics(orgMetrics);
      setViewLevel('organization');
    } catch (err) {
      setError('Failed to load organization metrics.');
      console.error('Error loading organization metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      const teamsData = await apiService.getTeams(selectedProduct);
      setTeams(teamsData);
      
      // Reset team/sprint selection when product changes
      setSelectedTeam(null);
      setSelectedSprint(null);
    } catch (err) {
      setError('Failed to load teams.');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    // If nothing is selected, show organization-wide metrics
    if (!selectedProduct && !selectedTeam && !selectedSprint) {
      await loadOrganizationMetrics();
      return;
    }

    if (!selectedProduct) return;

    try {
      setLoading(true);
      setError(null);
      
      let metricsData;
      if (selectedTeam && selectedSprint) {
        // Sprint level
        setViewLevel('sprint');
        metricsData = await apiService.getMetrics(selectedTeam, selectedSprint);
      } else if (selectedTeam) {
        // Team level
        setViewLevel('team');
        metricsData = await apiService.getTeamMetrics(selectedTeam);
      } else {
        // Product level
        setViewLevel('product');
        metricsData = await apiService.getProductMetrics(selectedProduct);
      }
      
      setMetrics(metricsData);
    } catch (err) {
      setError('Failed to load metrics for selected level.');
      console.error('Error loading metrics:', err);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadMetrics();
  };

  const handleExport = () => {
    alert('PDF Export will be implemented in Phase 1 Week 3');
  };

  const tadTsChartData = metrics ? {
    labels: ['TAD', 'TS'],
    datasets: [
      {
        label: 'Complete',
        data: [metrics.tadTsMetrics.tadComplete, metrics.tadTsMetrics.tsComplete],
        backgroundColor: '#52c41a',
      },
      {
        label: 'N/A',
        data: [metrics.tadTsMetrics.tadNa, metrics.tadTsMetrics.tsNa],
        backgroundColor: '#faad14',
      },
      {
        label: 'Missing',
        data: [metrics.tadTsMetrics.tadMissing, metrics.tadTsMetrics.tsMissing],
        backgroundColor: '#ff4d4f',
      },
    ],
  } : null;

  const automationChartData = metrics ? {
    labels: ['Automated', 'Manual'],
    datasets: [
      {
        data: [
          metrics.qtestMetrics.automatedTestCases,
          metrics.qtestMetrics.manualTestCases,
        ],
        backgroundColor: ['#1890ff', '#d9d9d9'],
      },
    ],
  } : null;

  const defectsChartData = metrics ? {
    labels: Object.keys(metrics.defectMetrics.bySdlc),
    datasets: [
      {
        label: 'Defects',
        data: Object.values(metrics.defectMetrics.bySdlc),
        backgroundColor: '#ff7875',
      },
    ],
  } : null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            color: '#fff', 
            fontSize: '24px', 
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            ⭐
          </div>
          <AntTitle level={3} style={{ color: '#fff', margin: 0 }}>
            Polaris - ELM Metrics Dashboard
          </AntTitle>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            type="primary"
          >
            Export PDF
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Product:</strong>
                <Select
                  data-testid="product-selector"
                  style={{ flex: 1 }}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  loading={products.length === 0}
                  placeholder="Select Product"
                  allowClear
                  options={products.map(product => ({
                    label: product.displayName,
                    value: product.id
                  }))}
                />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Team:</strong>
                <Select
                  data-testid="team-selector"
                  style={{ flex: 1 }}
                  value={selectedTeam}
                  onChange={setSelectedTeam}
                  loading={teams.length === 0}
                  disabled={!selectedProduct}
                  placeholder="All Teams"
                  allowClear
                  options={teams.map(team => ({
                    label: team.displayName,
                    value: team.id
                  }))}
                />
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Sprint:</strong>
                <Select
                  data-testid="sprint-selector"
                  style={{ flex: 1 }}
                  value={selectedSprint}
                  onChange={setSelectedSprint}
                  loading={sprints.length === 0}
                  disabled={!selectedTeam}
                  placeholder="All Sprints"
                  allowClear
                  options={sprints.map(sprint => ({
                    label: `Sprint ${sprint.name}`,
                    value: sprint.id
                  }))}
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Card style={{ marginBottom: 24, textAlign: 'center', background: '#e6f7ff' }} data-testid="view-level-indicator">
          <div style={{ color: '#666' }}>
            📊 <strong>Viewing {viewLevel.charAt(0).toUpperCase() + viewLevel.slice(1)} Level Metrics</strong>
            <br />
            <small>
              {viewLevel === 'organization' && 'Aggregated metrics across all products and teams'}
              {viewLevel === 'product' && 'Aggregated metrics across all teams in selected product'}
              {viewLevel === 'team' && 'Aggregated metrics for selected team across all sprints'}
              {viewLevel === 'sprint' && 'Specific sprint metrics for selected team'}
            </small>
          </div>
        </Card>

        {loading && !metrics ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large">
              <div style={{ marginTop: 20 }}>Loading metrics...</div>
            </Spin>
          </div>
        ) : metrics ? (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card data-testid="tad-compliance-card">
                  <Statistic
                    title="TAD Compliance"
                    value={metrics.tadTsMetrics.tadPct}
                    precision={1}
                    suffix="%"
                  />
                  <Progress 
                    percent={metrics.tadTsMetrics.tadPct} 
                    status={metrics.tadTsMetrics.tadPct >= 80 ? 'success' : 'exception'}
                    strokeColor={metrics.tadTsMetrics.tadPct >= 80 ? '#52c41a' : '#ff4d4f'}
                  />
                  <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                    {metrics.tadTsMetrics.tadComplete} Complete, {metrics.tadTsMetrics.tadNa} N/A, {metrics.tadTsMetrics.tadMissing} Missing
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card data-testid="ts-compliance-card">
                  <Statistic
                    title="TS Compliance"
                    value={metrics.tadTsMetrics.tsPct}
                    precision={1}
                    suffix="%"
                  />
                  <Progress 
                    percent={metrics.tadTsMetrics.tsPct} 
                    status={metrics.tadTsMetrics.tsPct >= 80 ? 'success' : 'exception'}
                    strokeColor={metrics.tadTsMetrics.tsPct >= 80 ? '#52c41a' : '#ff4d4f'}
                  />
                  <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                    {metrics.tadTsMetrics.tsComplete} Complete, {metrics.tadTsMetrics.tsNa} N/A, {metrics.tadTsMetrics.tsMissing} Missing
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card data-testid="automation-card">
                  <Statistic
                    title="Test Automation"
                    value={metrics.qtestMetrics.automationPct}
                    precision={1}
                    suffix="%"
                  />
                  <Progress 
                    percent={metrics.qtestMetrics.automationPct} 
                    status={metrics.qtestMetrics.automationPct >= 70 ? 'success' : 'normal'}
                    strokeColor="#1890ff"
                  />
                  <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                    {metrics.qtestMetrics.automatedTestCases} Automated, {metrics.qtestMetrics.manualTestCases} Manual
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="TAD/TS Compliance Breakdown">
                  {tadTsChartData && (
                    <Bar 
                      data={tadTsChartData} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                        },
                        scales: {
                          x: { stacked: true },
                          y: { stacked: true, beginAtZero: true }
                        }
                      }}
                    />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Test Automation Coverage">
                  {automationChartData && (
                    <Pie 
                      data={automationChartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                        },
                      }}
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Defects by SDLC Phase">
                  {defectsChartData && (
                    <Bar 
                      data={defectsChartData}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                        },
                      }}
                    />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Sprint Summary">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="Total Stories" value={metrics.tadTsMetrics.totalStories} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Test Runs" value={metrics.qtestMetrics.totalTestRuns} />
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Statistic title="Total Defects" value={metrics.defectMetrics.totalDefects} />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="Reopened %" 
                        value={metrics.defectMetrics.reopenedPct} 
                        precision={1}
                        suffix="%"
                        valueStyle={{ color: metrics.defectMetrics.reopenedPct > 20 ? '#cf1322' : '#3f8600' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

          </>
        ) : null}
      </Content>
    </Layout>
  );
}

export default App;
