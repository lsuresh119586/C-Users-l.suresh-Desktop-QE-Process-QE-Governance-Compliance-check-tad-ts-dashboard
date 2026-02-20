# ELM Dashboard API Gateway - SQL Server Configuration

This API gateway has been converted from a file-based JSON database to use **SQL Server**.

## Prerequisites

- Node.js 18.0.0 or higher
- SQL Server 2019 or later (local or remote)
- Or Azure SQL Database

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables by creating a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your SQL Server credentials:
```
DB_SERVER=localhost
DB_NAME=ELMDashboard
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

## Database Setup

The application will automatically:
1. Connect to SQL Server
2. Create required tables (Products, Teams, Sprints, Metrics) if they don't exist
3. Seed initial data on first run

### Manual SQL Server Setup (Optional)

If you need to set up SQL Server locally:

**Docker:**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

**Or download SQL Server Express:**
https://www.microsoft.com/en-us/sql-server/sql-server-downloads

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/teams?product=<product_id>` - Get teams for a product
- `GET /api/sprints?team=<team_id>&product=<product_id>` - Get sprints
- `GET /api/metrics?sprint=<sprint_id>` - Get metrics
- `POST /api/metrics` - Create new metric
- `GET /health` - Health check

## Database Schema

### Products Table
- `id` (PK): Product identifier
- `name`: Product name
- `createdAt`: Timestamp

### Teams Table
- `id` (PK): Team identifier
- `name`: Team name
- `product` (FK): Reference to Products
- `createdAt`: Timestamp

### Sprints Table
- `id` (PK): Sprint identifier
- `name`: Sprint name
- `team` (FK): Reference to Teams
- `product` (FK): Reference to Products
- `createdAt`: Timestamp

### Metrics Table
- `id` (PK): Metric identifier
- `product` (FK): Reference to Products
- `team` (FK): Reference to Teams
- `sprint` (FK): Reference to Sprints
- `metricsDate`: Date of metrics
- `requirementsCovered`: Coverage percentage
- `testsCovered`: Test coverage percentage
- `defectsOpen`: Open defect count
- `defectsClosed`: Closed defect count
- `deploymentReadiness`: Deployment readiness percentage
- `codeQuality`: Code quality score
- `createdAt`: Timestamp

## Troubleshooting

**Connection Error:**
- Verify SQL Server is running
- Check connection string in `.env`
- Ensure firewall allows port 1433

**Authentication Error:**
- Verify username and password
- For SQL Server, use 'sa' account initially
- For Azure SQL, use format: `username@server`

**Table Creation Error:**
- Check SQL Server permissions
- Ensure database exists or create manually:
  ```sql
  CREATE DATABASE ELMDashboard;
  ```
