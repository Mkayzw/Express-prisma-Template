# Jobs API

Background job management. All endpoints require `ADMIN` role.

## Add Email Job

```http
POST /api/v1/jobs/email
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Hello",
  "body": "This is the email content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "123"
  }
}
```

## Add Cleanup Job

```http
POST /api/v1/jobs/cleanup
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "expired_sessions",
  "olderThanDays": 7
}
```

**Cleanup Types:**
- `expired_sessions` - Clear expired refresh tokens
- `old_logs` - Clear old audit logs
- `orphaned_data` - Clean orphaned records

## Get Job Status

```http
GET /api/v1/jobs/:queue/:jobId
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `queue` - Queue name (email, cleanup, notification)
- `jobId` - Job ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "send-email",
    "status": "completed",
    "progress": 100,
    "attemptsMade": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "finishedAt": "2024-01-01T00:00:05.000Z"
  }
}
```

## Get Queue Stats

```http
GET /api/v1/jobs/:queue/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "email",
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0
  }
}
```
