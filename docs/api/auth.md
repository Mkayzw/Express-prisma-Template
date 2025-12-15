# Authentication API

## Register

Create a new user account.

```http
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx2...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Refresh Token

Exchange refresh token for new token pair.

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

## Logout

Invalidate current session.

```http
POST /api/v1/auth/logout
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

## Logout All

Invalidate all sessions (requires auth).

```http
POST /api/v1/auth/logout-all
Authorization: Bearer <access_token>
```

## Verify Token

Check if token is valid.

```http
GET /api/v1/auth/verify
Authorization: Bearer <access_token>
```

## Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```
