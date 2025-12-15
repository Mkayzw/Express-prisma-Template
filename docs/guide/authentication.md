# Authentication

JWT-based authentication with access/refresh token rotation.

## Overview

The authentication system uses:
- **Access tokens** - Short-lived (15 min), stateless JWT
- **Refresh tokens** - Long-lived (7 days), stored in Redis
- **Session tracking** - Per-user session management

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

Returns new access and refresh tokens. The old refresh token is invalidated.

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

Invalidates all refresh tokens for the user.

## Protected Routes

Add the `Authorization` header with a valid access token:

```http
GET /api/v1/users/profile
Authorization: Bearer <access_token>
```

## Role-Based Access

Use the `authorize` middleware for role restrictions:

```typescript
import { authenticate, authorize } from './middleware/authGuard';

// Admin only
router.get('/admin', authenticate, authorize('ADMIN'), handler);
```
