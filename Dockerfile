# ============================================================
# Polaris ELM Metrics Dashboard — Multi-Stage Dockerfile
# ============================================================
# Traceability:
#   spec.md  Section 7.2 (FR-DEPLOY-1, FR-DEPLOY-2, FR-DEPLOY-5)
#   plan.md  Section 16.2 (Dockerfile Strategy)
#   tasks.md TASK-DEPLOY-001
# ============================================================

# --------------------------------------------------
# Stage 1: Build Frontend (Vite → dist/)
# --------------------------------------------------
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy frontend source files needed for build
COPY frontend/ ./

# Build the Vite frontend → produces dist/ folder
RUN npm run build

# --------------------------------------------------
# Stage 2: Production Runtime
# --------------------------------------------------
FROM node:18-alpine AS production

# Add labels for container registry
LABEL maintainer="ELM QE Team"
LABEL application="polaris-elm-dashboard"
LABEL description="Polaris ELM Metrics Dashboard - Unified Quality Metrics"

# Create non-root user for security
RUN addgroup -S polaris && adduser -S polaris -G polaris

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY backend/api-gateway/package.json backend/api-gateway/package-lock.json* ./backend/api-gateway/
RUN cd backend/api-gateway && npm ci --production

# Copy backend source code
COPY backend/api-gateway/ ./backend/api-gateway/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set ownership to non-root user
RUN chown -R polaris:polaris /app

# Switch to non-root user
USER polaris

# Azure App Service injects PORT env var (typically 8080)
# Fallback to 3000 for local Docker runs
ENV NODE_ENV=production
EXPOSE 8080

# Health check — verify the server responds
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/api/products || exit 1

# Start the backend server (which also serves frontend static files)
CMD ["node", "backend/api-gateway/server.js"]
