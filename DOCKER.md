# Docker Setup Guide

This project can be run using Docker and Docker Compose. The setup includes:

- **PostgreSQL** database
- **Backend API** (Elysia with Bun) on port 3000
- **Frontend** (React with Vite) on port 5173

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- Port 3000 and 5173 available (or configure different ports)

## Quick Start

1. **Copy the environment example file:**

   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file** with your configuration:

   - Set `POSTGRES_PASSWORD` to a secure password
   - Set `BETTER_AUTH_SECRET` (generate a secure random string)
   - Update `BETTER_AUTH_URL` if needed
   - Update CORS origins if deploying to a different domain

3. **Check for port conflicts:**

   ```bash
   # Check if port 3000 is in use
   lsof -i:3000

   # If port 3000 is in use, either:
   # Option A: Stop the process using it
   kill $(lsof -ti:3000)

   # Option B: Change BACKEND_PORT in .env to a different port (e.g., 3001)
   ```

4. **Build and start all services:**

   ```bash
   docker-compose up -d --build
   ```

5. **Run database migrations** (if needed):

   ```bash
   docker-compose exec backend bun run db:push
   ```

6. **Seed the database** (optional):
   ```bash
   docker-compose exec backend bun run db:seed
   ```

## Services

- **Frontend**: http://localhost:5173 (or port specified in `.env`)
- **Backend API**: http://localhost:3000 (or port specified in `.env`)
- **PostgreSQL**: localhost:5432 (or port specified in `.env`)

## Useful Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes database data)

```bash
docker-compose down -v
```

### Rebuild a specific service

```bash
docker-compose build backend
docker-compose up -d backend
```

### Execute commands in containers

```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec postgres psql -U schedule -d schedule
```

## Development vs Production

### Development

For development, you might want to:

- Use volume mounts for hot-reloading
- Run services separately
- Use different environment variables

### Production

For production:

- Ensure all environment variables are set securely
- Use proper secrets management
- Configure proper CORS origins
- Set up SSL/TLS (consider using a reverse proxy like Traefik or Nginx)
- Configure proper database backups

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret key for authentication (generate a secure random string)
- `BETTER_AUTH_URL` - Base URL for authentication callbacks

### Optional Variables

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Database credentials
- `BACKEND_PORT`, `FRONTEND_PORT` - Port mappings (defaults: 3000, 5173)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

## Troubleshooting

### Port already in use

**Port 3000 in use:**

```bash
# Find what's using it
lsof -i:3000

# Stop it (if it's your local dev server)
kill $(lsof -ti:3000)

# Or change BACKEND_PORT in .env to a different port
```

**Port 5173 in use:**

```bash
# Find what's using it
lsof -i:5173

# Stop it
kill $(lsof -ti:5173)

# Or change FRONTEND_PORT in .env to a different port
```

### Database connection issues

- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify `DATABASE_URL` in `.env` matches the postgres service configuration

### Backend won't start

- Check backend logs: `docker-compose logs backend`
- Verify all environment variables are set
- Ensure database is ready before backend starts (docker-compose handles this)
- Check if port 3000 is available or change `BACKEND_PORT` in `.env`

### Frontend can't connect to backend

- **Important**: The frontend code currently uses hardcoded `http://localhost:3000` URLs
- For Docker, you have two options:
  1. **Use nginx proxy** (recommended): Update frontend code to use relative URLs (`/api/...` instead of `http://localhost:3000/api/...`)
  2. **Direct connection**: Ensure backend is accessible at the configured port and CORS is properly configured
- Verify `VITE_API_URL` is set correctly if using build-time configuration
- Check CORS configuration in backend if accessing backend directly
- Ensure backend is running and accessible

## Building Individual Services

### Backend only

```bash
cd apps/backend
docker build -t schedule-backend .
docker run -p 3000:3000 --env-file ../.env schedule-backend
```

### Frontend only

```bash
cd apps/frontend
docker build -t schedule-frontend .
docker run -p 5173:5173 schedule-frontend
```

## Notes

- The backend uses Bun runtime for optimal performance
- The frontend is built as a static site and served with Nginx on port 5173
- **API Proxy**: Nginx is configured to proxy `/api/*` requests to the backend, so the frontend makes requests to `/api` (same origin), avoiding CORS issues
- Database data persists in a Docker volume (`postgres_data`)
- All services communicate through a Docker network (`schedule-network`)
- The frontend is built with `VITE_API_URL` as a build-time variable, but since nginx proxies requests, this is mainly for reference

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ http://localhost:5173
       │
┌──────▼──────────────────┐
│   Frontend (Nginx)       │
│   - Serves static files   │
│   - Proxies /api → backend│
└──────┬───────────────────┘
       │
       │ /api requests
       │
┌──────▼──────────┐      ┌──────────────┐
│   Backend       │◄─────┤  PostgreSQL  │
│   (Elysia/Bun)  │      │   Database   │
└─────────────────┘      └──────────────┘
```
