# Users API

All endpoints require authentication.

## Get Profile

Get current user's profile.

```http
GET /api/v1/users/profile
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx2...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Update Profile

```http
PUT /api/v1/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

---

## Admin Endpoints

These require `ADMIN` role.

### List Users

```http
GET /api/v1/users?page=1&limit=10&search=john
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc or desc (default: desc)
- `search` - Search by email/name

### Get User

```http
GET /api/v1/users/:id
Authorization: Bearer <admin_token>
```

### Create User

```http
POST /api/v1/users
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "new@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User"
}
```

### Update User

```http
PUT /api/v1/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Updated",
  "role": "ADMIN"
}
```

### Delete User

```http
DELETE /api/v1/users/:id
Authorization: Bearer <admin_token>
```
