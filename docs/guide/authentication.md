# Authentication

JWT-based authentication with access/refresh token rotation and Redis-backed sessions.

## What You'll Learn

- How the token system works
- Protecting routes with authentication
- Managing user sessions
- Role-based access control
- Security best practices

## Overview

The authentication system uses a dual-token approach:

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| **Access Token** | 15 minutes | Client memory | API requests |
| **Refresh Token** | 7 days | HTTP-only cookie + Redis | Token renewal |

## Token Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Login     │────▶│ Access Token │────▶│  API Request │
│              │     │ (15 min)     │     │              │
└──────────────┘     └───────┬──────┘     └──────────────┘
                             │ expired
                     ┌───────▼──────┐
                     │   Refresh    │
                     │   Token      │
                     │   (7 days)   │
                     └───────┬──────┘
                             │
                     ┌───────▼──────┐
                     │  New Tokens  │
                     │  (rotation)  │
                     └──────────────┘
```

When an access token expires:
1. Client sends refresh token to `/api/v1/auth/refresh`
2. Server validates refresh token in Redis
3. Old refresh token is invalidated
4. New access + refresh tokens are issued

## Endpoints

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "USER" },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

Returns new access and refresh tokens. The old refresh token is invalidated (rotation).

### Logout

```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Logout All Sessions

```http
POST /api/v1/auth/logout-all
Authorization: Bearer <access_token>
```

Invalidates all refresh tokens for the user across all devices.

## Protecting Routes

### Basic Authentication

Use the `authenticate` middleware to require a valid access token:

```typescript
import { authenticate } from './middleware/authGuard';

// Protected route - requires login
router.get('/profile', authenticate, getProfile);
```

### Role-Based Access

Use the `authorize` middleware for role restrictions:

```typescript
import { authenticate, authorize } from './middleware/authGuard';

// Admin only
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);

// Multiple roles
router.get('/reports', authenticate, authorize('ADMIN', 'MANAGER'), getReports);
```

### Optional Authentication

For routes that work with or without authentication:

```typescript
import { optionalAuth } from './middleware/authGuard';

router.get('/posts', optionalAuth, getPosts);

// In controller
const getPosts = async (req: Request, res: Response) => {
  if (req.user) {
    // Show personalized content
  } else {
    // Show public content
  }
};
```

## Session Management

Sessions are stored in Redis with the following structure:

```
refresh_token:{userId}:{tokenId} -> { userId, createdAt, userAgent }
```

This enables:
- Per-device session tracking
- Selective logout (single device)
- Logout all sessions
- Session expiration

### View Active Sessions (if implemented)

```http
GET /api/v1/auth/sessions
Authorization: Bearer <access_token>
```

## Security Configuration

Configure token lifetimes in `.env`:

```env
JWT_SECRET="your-super-secret-key-at-least-64-chars"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

::: warning Production Security
- Use a strong secret: `openssl rand -hex 64`
- Use HTTPS in production
- Consider shorter access token lifetime (5-15 min)
- Implement rate limiting on auth endpoints
:::

## Security Features

### Password Hashing
Passwords are hashed with bcrypt (12 rounds) before storage.

### Token Rotation
Each refresh generates new tokens, preventing token reuse attacks.

### Automatic Cleanup
Expired sessions are automatically cleaned up by a background job.

## Frontend Integration

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Add access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### Fetch Example

```typescript
async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    // Handle token refresh
    await refreshTokens();
    return authFetch(url, options); // Retry
  }
  
  return response;
}
```

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Invalid or missing token |
| 401 | `TOKEN_EXPIRED` | Access token expired |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token invalid or expired |
| 403 | `FORBIDDEN` | Insufficient permissions |
