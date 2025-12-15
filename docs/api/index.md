# API Overview

Base URL: `http://localhost:3000/api/v1`

## Authentication

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh tokens |
| POST | `/auth/logout` | No | Logout |
| POST | `/auth/logout-all` | Yes | Logout all sessions |
| POST | `/auth/change-password` | Yes | Change password |
| GET | `/auth/verify` | Yes | Verify token |
| GET | `/users/profile` | Yes | Get profile |
| PUT | `/users/profile` | Yes | Update profile |
| GET | `/users` | Admin | List users |
| GET | `/users/:id` | Admin | Get user |
| POST | `/users` | Admin | Create user |
| PUT | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Delete user |
| POST | `/jobs/email` | Admin | Add email job |
| POST | `/jobs/cleanup` | Admin | Add cleanup job |
| GET | `/jobs/:queue/:jobId` | Admin | Get job status |
| GET | `/jobs/:queue/stats` | Admin | Get queue stats |

## Health Endpoints

| Path | Description |
|------|-------------|
| `/health` | Basic health check |
| `/health/live` | Kubernetes liveness |
| `/health/ready` | Readiness with DB/Redis |
| `/metrics` | Prometheus metrics |
