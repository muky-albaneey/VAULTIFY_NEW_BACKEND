# Access Codes, Alerts & Announcements Guide

Complete documentation for visitor access codes, alerts, and announcements in the Vaultify Estate Management Platform.

---

## Table of Contents

1. [Access Codes](#access-codes)
2. [Alerts](#alerts)
3. [Announcements](#announcements)

---

## 1. Access Codes

### Overview

Access codes allow residents to generate time-bounded, single-use or multi-use codes for visitors. These codes can be validated at estate gates by security personnel to grant entry.

### Key Features

- **Time-bounded**: Codes have `valid_from` and `valid_to` timestamps
- **Usage limits**: Configurable `max_uses` (default: 1)
- **Usage tracking**: Tracks `current_uses` to prevent overuse
- **Gate assignment**: Optional gate specification
- **Notifications**: Optional notification when code is used
- **Auto-deactivation**: Codes expire after `valid_to` date or when max uses reached

### Entity Structure

```typescript
{
  code: string (UUID, 8-char uppercase) // Primary key
  creator_user_id: string
  visitor_name: string
  visitor_email?: string
  visitor_phone?: string
  valid_from: Date
  valid_to: Date
  max_uses: number (default: 1)
  current_uses: number (default: 0)
  gate?: string
  is_active: boolean (default: true)
  notify_on_use: boolean (default: true)
  created_at: Date
}
```

---

### API Endpoints

#### 1.1 Create Access Code

**Endpoint:** `POST /access-codes`

**Access:** All authenticated residents

**Request Body:**
```json
{
  "visitor_name": "John Doe",
  "visitor_email": "john@example.com", // Optional
  "visitor_phone": "+2348012345678", // Optional
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "max_uses": 1, // Optional, default: 1
  "gate": "Main Gate", // Optional
  "notify_on_use": true // Optional, default: true
}
```

**Response (201):**
```json
{
  "code": "A1B2C3D4",
  "creator_user_id": "user-uuid",
  "visitor_name": "John Doe",
  "visitor_email": "john@example.com",
  "visitor_phone": "+2348012345678",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "max_uses": 1,
  "current_uses": 0,
  "gate": "Main Gate",
  "is_active": true,
  "notify_on_use": true,
  "created_at": "2024-01-15T09:00:00Z",
  "creator": {
    "user_id": "user-uuid",
    "email": "jane.smith@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "status": "active",
    "profile": {
      "phone_number": "+2348012345678",
      "role": "Residence",
      "apartment_type": "2-Bedroom",
      "house_address": "Block A, Flat 101",
      "estate_id": "estate-uuid",
      "profile_picture_url": "https://storage.example.com/profile.jpg"
    }
  }
}
```

**Validation Rules:**
- `valid_from` must be before `valid_to`
- `visitor_name` is required
- `max_uses` must be positive if provided

---

#### 1.2 Get User's Access Codes

**Endpoint:** `GET /access-codes`

**Access:** All authenticated residents

**Response (200):**
```json
[
  {
    "code": "A1B2C3D4",
    "creator_user_id": "user-uuid",
    "visitor_name": "John Doe",
    "visitor_email": "john@example.com",
    "visitor_phone": "+2348012345678",
    "valid_from": "2024-01-15T10:00:00Z",
    "valid_to": "2024-01-15T18:00:00Z",
    "max_uses": 1,
    "current_uses": 0,
    "gate": "Main Gate",
    "is_active": true,
    "notify_on_use": true,
    "created_at": "2024-01-15T09:00:00Z",
    "creator": {
      "user_id": "user-uuid",
      "email": "jane.smith@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "status": "active",
      "profile": {
        "phone_number": "+2348012345678",
        "role": "Residence",
        "apartment_type": "2-Bedroom",
        "house_address": "Block A, Flat 101",
        "estate_id": "estate-uuid",
        "profile_picture_url": "https://storage.example.com/profile.jpg"
      }
    }
  }
]
```

**Note:** Returns all access codes created by the authenticated user, ordered by creation date (newest first).

---

#### 1.3 Validate Access Code

**Endpoint:** `POST /access-codes/validate/:code`

**Access:** All authenticated users (typically used by security personnel)

**URL Parameters:**
- `code`: The 8-character access code to validate

**Response (200):**
```json
{
  "code": "A1B2C3D4",
  "visitor_name": "John Doe",
  "visitor_email": "john@example.com",
  "visitor_phone": "+2348012345678",
  "creator": {
    "user_id": "user-uuid",
    "email": "jane.smith@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "status": "active",
    "profile": {
      "phone_number": "+2348012345678",
      "role": "Residence",
      "apartment_type": "2-Bedroom",
      "house_address": "Block A, Flat 101",
      "estate_id": "estate-uuid",
      "profile_picture_url": "https://storage.example.com/profile.jpg"
    }
  },
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "remaining_uses": 0
}
```

**Error Responses:**
- `404`: Access code not found
- `400`: Access code has expired or reached maximum uses

**Important:** 
- Validation automatically increments `current_uses`
- If `current_uses >= max_uses` after validation, code cannot be used again
- If current time is outside `valid_from` to `valid_to` range, validation fails

---

#### 1.4 Deactivate Access Code

**Endpoint:** `PUT /access-codes/:code/deactivate`

**Access:** Code creator only

**URL Parameters:**
- `code`: The access code to deactivate

**Response (200):**
```json
{
  "message": "Access code deactivated successfully"
}
```

**Error Responses:**
- `404`: Access code not found or you are not the creator

**Note:** Deactivation sets `is_active` to `false`, preventing further validation even if within valid time range.

---

### Use Cases

1. **Single-Use Visitor Code**
   - Set `max_uses: 1` for one-time visitors
   - Code becomes invalid after first use

2. **Multi-Use Visitor Code**
   - Set `max_uses: 5` for visitors who may enter/exit multiple times
   - Code remains valid until max uses reached

3. **Time-Limited Access**
   - Set `valid_from` and `valid_to` for specific time windows
   - Useful for scheduled visits

4. **Gate-Specific Access**
   - Specify `gate` field for multi-gate estates
   - Helps security personnel route visitors correctly

---

### Best Practices

1. **Code Generation**: Codes are auto-generated as 8-character uppercase UUIDs
2. **Time Validation**: Always ensure `valid_from < valid_to`
3. **Usage Tracking**: Monitor `current_uses` vs `max_uses` to prevent overuse
4. **Deactivation**: Manually deactivate codes if visitor cancels
5. **Security**: Share codes securely with visitors (SMS, email, messaging apps)

---

## 2. Alerts

### Overview

Alerts enable residents to send time-sensitive notifications to other residents, their estate, or all users. Alerts support different types and urgency levels, with automatic push notifications to recipients.

### Key Features

- **Multiple Recipient Types**: User-specific, estate-wide, or all users
- **Alert Types**: General, Emergency, Maintenance, Security, Utility
- **Urgency Levels**: Low, Medium, High, Critical
- **Push Notifications**: Automatic notifications sent to recipients
- **Soft Delete**: Recipients can hide alerts without deleting them globally
- **Estate Scoping**: Residents can only send alerts to their own estate

### Entity Structure

```typescript
{
  alert_id: string (UUID)
  sender_user_id: string
  message: string
  alert_type: 'general' | 'emergency' | 'maintenance' | 'security' | 'utility'
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
  recipients: {
    type: 'user' | 'estate' | 'all'
    user_id?: string // For 'user' type
    user_ids?: string[] // For multiple users
    estate_id?: string // For 'estate' type
  }
  timestamp: Date
}
```

---

### API Endpoints

#### 2.1 Create Alert

**Endpoint:** `POST /alerts`

**Access:** All authenticated residents

**Request Body:**
```json
{
  "message": "Water supply will be interrupted tomorrow from 9 AM to 3 PM for maintenance",
  "alert_type": "maintenance",
  "urgency_level": "medium",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid" // Optional, defaults to sender's estate
  }
}
```

**Recipient Types:**

1. **Estate-wide** (most common):
```json
{
  "type": "estate",
  "estate_id": "estate-uuid" // Optional, auto-filled from sender's estate
}
```

2. **All Users** (platform-wide):
```json
{
  "type": "all"
}
```

3. **Specific User(s)**:
```json
{
  "type": "user",
  "user_ids": ["user-uuid-1", "user-uuid-2"]
}
```

**Response (201):**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "user-uuid",
  "message": "Water supply will be interrupted tomorrow from 9 AM to 3 PM for maintenance",
  "alert_type": "maintenance",
  "urgency_level": "medium",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Validation Rules:**
- Residents can only send alerts to their own estate
- If `recipients.type === 'estate'` and no `estate_id` provided, uses sender's estate
- Message is required and must not be empty

---

#### 2.2 Get User Alerts

**Endpoint:** `GET /alerts/me?page=1&limit=20`

**Access:** All authenticated residents

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "alert_id": "alert-uuid",
      "sender_user_id": "user-uuid",
      "message": "Water supply will be interrupted tomorrow",
      "alert_type": "maintenance",
      "urgency_level": "medium",
      "recipients": {
        "type": "estate",
        "estate_id": "estate-uuid"
      },
      "timestamp": "2024-01-15T10:00:00Z",
      "sender": {
        "user_id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe",
        "profile": {
          "role": "Residence"
        }
      }
    }
  ],
  "page": 1,
  "limit": 20
}
```

**Note:** 
- Returns alerts where user is a recipient (based on recipient type)
- Excludes alerts the user has deleted (soft delete)
- Ordered by timestamp (newest first)

---

#### 2.3 Get Alert by ID

**Endpoint:** `GET /alerts/:id`

**Access:** Alert recipients only

**URL Parameters:**
- `id`: Alert UUID

**Response (200):**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "user-uuid",
  "message": "Water supply will be interrupted tomorrow",
  "alert_type": "maintenance",
  "urgency_level": "medium",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid"
  },
  "timestamp": "2024-01-15T10:00:00Z",
  "sender": {
    "user_id": "user-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "role": "Residence"
    }
  }
}
```

**Error Responses:**
- `404`: Alert not found
- `400`: You do not have access to this alert

---

#### 2.4 Update Alert

**Endpoint:** `PUT /alerts/:id`

**Access:** Alert sender only

**URL Parameters:**
- `id`: Alert UUID

**Request Body:**
```json
{
  "message": "Updated message", // Optional
  "alert_type": "emergency", // Optional
  "urgency_level": "high", // Optional
  "recipients": { // Optional
    "type": "estate",
    "estate_id": "estate-uuid"
  }
}
```

**Response (200):**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "user-uuid",
  "message": "Updated message",
  "alert_type": "emergency",
  "urgency_level": "high",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `404`: Alert not found or you are not the sender

---

#### 2.5 Delete Alert

**Endpoint:** `DELETE /alerts/:id`

**Access:** Alert sender or recipients

**URL Parameters:**
- `id`: Alert UUID

**Request Body:**
```json
{
  "reason": "No longer relevant" // Optional
}
```

**Response (200):**
```json
{
  "message": "Alert deleted successfully" // For sender
}
```
OR
```json
{
  "message": "Alert marked as deleted for you" // For recipient
}
```

**Behavior:**
- **Sender**: Permanently deletes the alert for all recipients
- **Recipient**: Soft deletes (hides from their view only)

---

#### 2.6 Get Estate Alerts (Admin/Security Only)

**Endpoint:** `GET /alerts/estate/:estateId?page=1&limit=20`

**Access:** Estate Admin, Security Personnel, Super Admin

**URL Parameters:**
- `estateId`: Estate UUID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "alert_id": "alert-uuid",
      "sender_user_id": "user-uuid",
      "message": "Water supply interruption",
      "alert_type": "maintenance",
      "urgency_level": "medium",
      "recipients": {
        "type": "estate",
        "estate_id": "estate-uuid"
      },
      "timestamp": "2024-01-15T10:00:00Z",
      "sender": {
        "user_id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "page": 1,
  "limit": 20
}
```

---

#### 2.7 Get Alert Statistics (Admin/Security Only)

**Endpoint:** `GET /alerts/stats/:estateId?`

**Access:** Estate Admin, Security Personnel, Super Admin

**URL Parameters:**
- `estateId` (optional): Estate UUID (if not provided, returns platform-wide stats)

**Response (200):**
```json
{
  "total_alerts": 150,
  "alerts_by_type": [
    { "type": "general", "count": "50" },
    { "type": "emergency", "count": "10" },
    { "type": "maintenance", "count": "60" },
    { "type": "security", "count": "20" },
    { "type": "utility", "count": "10" }
  ],
  "alerts_by_urgency": [
    { "urgency": "low", "count": "40" },
    { "urgency": "medium", "count": "80" },
    { "urgency": "high", "count": "25" },
    { "urgency": "critical", "count": "5" }
  ]
}
```

---

### Alert Types

| Type | Description | Use Case |
|------|-------------|----------|
| `general` | General information | Community updates, general notices |
| `emergency` | Emergency situations | Urgent safety issues, immediate action required |
| `maintenance` | Maintenance notices | Scheduled repairs, service interruptions |
| `security` | Security alerts | Security concerns, suspicious activity |
| `utility` | Utility-related | Water, electricity, gas issues |

### Urgency Levels

| Level | Description | Notification Priority |
|-------|-------------|----------------------|
| `low` | Informational | Normal |
| `medium` | Important | Normal |
| `high` | Urgent | High |
| `critical` | Critical | Critical (may bypass DND) |

---

### Use Cases

1. **Estate-Wide Maintenance Alert**
   ```json
   {
     "message": "Water supply will be interrupted tomorrow 9 AM - 3 PM",
     "alert_type": "maintenance",
     "urgency_level": "medium",
     "recipients": { "type": "estate" }
   }
   ```

2. **Emergency Security Alert**
   ```json
   {
     "message": "Suspicious activity reported near Block B. Please be vigilant.",
     "alert_type": "security",
     "urgency_level": "high",
     "recipients": { "type": "estate" }
   }
   ```

3. **Personal Alert to Neighbor**
   ```json
   {
     "message": "Your package has been delivered to my unit",
     "alert_type": "general",
     "urgency_level": "low",
     "recipients": {
       "type": "user",
       "user_ids": ["neighbor-user-uuid"]
     }
   }
   ```

---

### Best Practices

1. **Urgency Levels**: Use appropriate urgency levels - don't mark routine notices as "critical"
2. **Alert Types**: Choose the correct alert type for better categorization
3. **Recipients**: Use estate-wide alerts for community-wide issues
4. **Message Clarity**: Keep messages clear and actionable
5. **Timing**: Send alerts at appropriate times (avoid late-night non-emergency alerts)

---

## 3. Announcements

### Overview

Announcements are formal communications from estate administrators to residents. Unlike alerts (which can be sent by any resident), announcements are admin-only and support rich content including images and payment reminders.

### Key Features

- **Admin-Only**: Only estate admins can create announcements
- **Rich Content**: Support for images, payment details, structured messages
- **Recipient Types**: All residents, security personnel, single user, or specific residents
- **Announcement Types**: General, Payment Reminder, Maintenance, Event, Security, Urgent
- **Payment Reminders**: Specialized announcements with payment details
- **Push Notifications**: Automatic notifications to recipients
- **Estate Scoping**: Admins can only send to their own estate

### Entity Structure

```typescript
{
  announcement_id: string (UUID)
  sender_user_id: string
  estate_id: string
  title: string
  message: string
  announcement_type: 'general' | 'payment_reminder' | 'maintenance' | 'event' | 'security' | 'urgent'
  recipient_type: 'all_residents' | 'security_personnel' | 'single_user' | 'specific_residents'
  target_user_ids?: string[] // For single_user or specific_residents
  payment_details?: {
    amount?: number
    due_date?: string
    description?: string
    utility_account_id?: string
  }
  image_urls?: string[]
  is_active: boolean (default: true)
  created_at: Date
  updated_at: Date
}
```

---

### API Endpoints

#### 3.1 Create Announcement

**Endpoint:** `POST /announcements`

**Access:** Estate Admin only

**Request Body:**
```json
{
  "title": "Monthly Estate Meeting",
  "message": "All residents are invited to the monthly estate meeting on January 20th at 6 PM in the community hall.",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "image_urls": [
    "https://storage.example.com/meeting-poster.jpg"
  ]
}
```

**Recipient Types:**

1. **All Residents**:
```json
{
  "recipient_type": "all_residents"
}
```

2. **Security Personnel Only**:
```json
{
  "recipient_type": "security_personnel"
}
```

3. **Single User**:
```json
{
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"]
}
```

4. **Specific Residents**:
```json
{
  "recipient_type": "specific_residents",
  "target_user_ids": ["user-uuid-1", "user-uuid-2"]
}
```

**Payment Reminder Example:**
```json
{
  "title": "Payment Reminder - Service Charge",
  "message": "This is a reminder that your service charge payment is due.",
  "announcement_type": "payment_reminder",
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"],
  "payment_details": {
    "amount": 50000,
    "due_date": "2024-01-31",
    "description": "Monthly service charge for January 2024",
    "utility_account_id": "account-uuid"
  }
}
```

**Response (201):**
```json
{
  "announcement_id": "announcement-uuid",
  "sender_user_id": "admin-uuid",
  "estate_id": "estate-uuid",
  "title": "Monthly Estate Meeting",
  "message": "All residents are invited...",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "target_user_ids": null,
  "payment_details": null,
  "image_urls": [
    "https://storage.example.com/meeting-poster.jpg"
  ],
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Validation Rules:**
- Only estate admins can create announcements
- `target_user_ids` required for `single_user` or `specific_residents` recipient types
- All target users must belong to the admin's estate
- Title max length: 200 characters

---

#### 3.2 Get My Announcements

**Endpoint:** `GET /announcements/me?page=1&limit=20`

**Access:** All authenticated residents

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "announcement_id": "announcement-uuid",
      "sender_user_id": "admin-uuid",
      "estate_id": "estate-uuid",
      "title": "Monthly Estate Meeting",
      "message": "All residents are invited...",
      "announcement_type": "event",
      "recipient_type": "all_residents",
      "target_user_ids": null,
      "payment_details": null,
      "image_urls": ["https://storage.example.com/meeting-poster.jpg"],
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "sender": {
        "user_id": "admin-uuid",
        "first_name": "Admin",
        "last_name": "User",
        "profile": {
          "role": "Admin"
        }
      },
      "estate": {
        "estate_id": "estate-uuid",
        "name": "Greenfield Estate"
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3
}
```

**Note:**
- Returns announcements where user is a recipient based on:
  - `all_residents`: All residents see these
  - `security_personnel`: Only security personnel see these
  - `single_user` or `specific_residents`: Only if user is in `target_user_ids`
- Only shows active announcements (`is_active: true`)
- Ordered by creation date (newest first)

---

#### 3.3 Get Announcement by ID

**Endpoint:** `GET /announcements/:id`

**Access:** Announcement recipients only

**URL Parameters:**
- `id`: Announcement UUID

**Response (200):**
```json
{
  "announcement_id": "announcement-uuid",
  "sender_user_id": "admin-uuid",
  "estate_id": "estate-uuid",
  "title": "Monthly Estate Meeting",
  "message": "All residents are invited...",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "target_user_ids": null,
  "payment_details": null,
  "image_urls": ["https://storage.example.com/meeting-poster.jpg"],
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "sender": {
    "user_id": "admin-uuid",
    "first_name": "Admin",
    "last_name": "User",
    "profile": {
      "role": "Admin"
    }
  },
  "estate": {
    "estate_id": "estate-uuid",
    "name": "Greenfield Estate"
  }
}
```

**Error Responses:**
- `404`: Announcement not found
- `401`: You do not have access to this announcement

---

#### 3.4 Get My Sent Announcements (Admin Only)

**Endpoint:** `GET /announcements/sent?page=1&limit=20`

**Access:** Estate Admin only

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "announcement_id": "announcement-uuid",
      "sender_user_id": "admin-uuid",
      "estate_id": "estate-uuid",
      "title": "Monthly Estate Meeting",
      "message": "All residents are invited...",
      "announcement_type": "event",
      "recipient_type": "all_residents",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "estate": {
        "estate_id": "estate-uuid",
        "name": "Greenfield Estate"
      }
    }
  ],
  "page": 1,
  "limit": 20
}
```

**Note:** Returns all announcements sent by the authenticated admin, regardless of active status.

---

#### 3.5 Update Announcement

**Endpoint:** `PUT /announcements/:id`

**Access:** Announcement sender (Admin) only

**URL Parameters:**
- `id`: Announcement UUID

**Request Body:**
```json
{
  "title": "Updated Title", // Optional
  "message": "Updated message", // Optional
  "announcement_type": "urgent", // Optional
  "recipient_type": "all_residents", // Optional
  "target_user_ids": ["user-uuid"], // Optional
  "payment_details": { // Optional
    "amount": 50000,
    "due_date": "2024-01-31"
  },
  "image_urls": ["https://storage.example.com/new-image.jpg"] // Optional
}
```

**Response (200):**
```json
{
  "announcement_id": "announcement-uuid",
  "sender_user_id": "admin-uuid",
  "estate_id": "estate-uuid",
  "title": "Updated Title",
  "message": "Updated message",
  "announcement_type": "urgent",
  "recipient_type": "all_residents",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

**Error Responses:**
- `404`: Announcement not found
- `401`: You can only update your own announcements

---

#### 3.6 Delete Announcement

**Endpoint:** `DELETE /announcements/:id`

**Access:** Announcement sender (Admin) only

**URL Parameters:**
- `id`: Announcement UUID

**Response (200):**
```json
{
  "message": "Announcement deleted successfully"
}
```

**Note:** Soft delete - sets `is_active` to `false`, hiding it from recipients but preserving data.

---

#### 3.7 Send Payment Reminder

**Endpoint:** `POST /announcements/payment-reminder`

**Access:** Estate Admin only

**Request Body:**
```json
{
  "target_user_id": "user-uuid",
  "amount": 50000,
  "due_date": "2024-01-31",
  "description": "Monthly service charge for January 2024",
  "utility_account_id": "account-uuid" // Optional
}
```

**Response (201):**
```json
{
  "announcement_id": "announcement-uuid",
  "sender_user_id": "admin-uuid",
  "estate_id": "estate-uuid",
  "title": "Payment Reminder - Monthly service charge for January 2024",
  "message": "This is a reminder that you have a payment of ₦50,000 due by 2024-01-31. Monthly service charge for January 2024",
  "announcement_type": "payment_reminder",
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"],
  "payment_details": {
    "amount": 50000,
    "due_date": "2024-01-31",
    "description": "Monthly service charge for January 2024",
    "utility_account_id": "account-uuid"
  },
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Note:** 
- Creates a specialized payment reminder announcement
- Sends push notification to the target user
- Payment details are included in the announcement for easy reference

---

### Announcement Types

| Type | Description | Use Case |
|------|-------------|----------|
| `general` | General announcements | Community updates, policy changes |
| `payment_reminder` | Payment reminders | Service charges, utility bills due |
| `maintenance` | Maintenance notices | Scheduled repairs, facility closures |
| `event` | Event announcements | Community meetings, social events |
| `security` | Security notices | Security protocols, safety updates |
| `urgent` | Urgent announcements | Critical information requiring immediate attention |

### Recipient Types

| Type | Description | Who Sees It |
|------|-------------|-------------|
| `all_residents` | All estate residents | All active residents in the estate |
| `security_personnel` | Security staff only | Only users with Security Personnel role |
| `single_user` | Single resident | Only the user specified in `target_user_ids[0]` |
| `specific_residents` | Multiple residents | Only users specified in `target_user_ids` |

---

### Use Cases

1. **Community Event Announcement**
   ```json
   {
     "title": "Annual Estate BBQ",
     "message": "Join us for the annual estate BBQ on Saturday...",
     "announcement_type": "event",
     "recipient_type": "all_residents",
     "image_urls": ["https://storage.example.com/bbq-poster.jpg"]
   }
   ```

2. **Payment Reminder**
   ```json
   {
     "title": "Payment Reminder - Service Charge",
     "message": "Your service charge payment is due...",
     "announcement_type": "payment_reminder",
     "recipient_type": "single_user",
     "target_user_ids": ["user-uuid"],
     "payment_details": {
       "amount": 50000,
       "due_date": "2024-01-31",
       "description": "Monthly service charge"
     }
   }
   ```

3. **Maintenance Notice**
   ```json
   {
     "title": "Elevator Maintenance",
     "message": "Elevator maintenance scheduled for...",
     "announcement_type": "maintenance",
     "recipient_type": "all_residents"
   }
   ```

4. **Security Personnel Notice**
   ```json
   {
     "title": "New Security Protocol",
     "message": "Please review the new security protocols...",
     "announcement_type": "security",
     "recipient_type": "security_personnel"
   }
   ```

---

### Best Practices

1. **Title Clarity**: Use clear, descriptive titles (max 200 characters)
2. **Message Structure**: Keep messages well-formatted and easy to read
3. **Images**: Use images to enhance announcements (posters, diagrams, etc.)
4. **Recipient Selection**: Choose appropriate recipient types - don't spam all residents for single-user issues
5. **Payment Reminders**: Use the payment reminder endpoint for structured payment notifications
6. **Timing**: Send announcements at appropriate times for maximum visibility
7. **Updates**: Update announcements rather than creating duplicates when information changes

---

## Comparison: Alerts vs Announcements

| Feature | Alerts | Announcements |
|--------|--------|---------------|
| **Who Can Send** | All residents | Estate Admins only |
| **Purpose** | Quick, time-sensitive notifications | Formal communications |
| **Content** | Text message only | Title, message, images, payment details |
| **Types** | General, Emergency, Maintenance, Security, Utility | General, Payment Reminder, Maintenance, Event, Security, Urgent |
| **Recipients** | User, Estate, All | All Residents, Security Personnel, Single User, Specific Residents |
| **Urgency Levels** | Low, Medium, High, Critical | N/A (type-based) |
| **Use Case** | "Water will be off tomorrow" | "Monthly estate meeting announcement" |

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/api/alerts",
  "method": "POST",
  "error": "BadRequestException",
  "message": "You can only send alerts to your own estate"
}
```

**Common Error Codes:**
- `400`: Bad Request (validation errors, invalid data)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Push Notifications

All alerts and announcements automatically trigger push notifications to recipients:

**Alert Notification:**
```json
{
  "title": "Alert: maintenance",
  "body": "Water supply will be interrupted tomorrow...",
  "data": {
    "type": "alert",
    "alert_id": "alert-uuid",
    "urgency_level": "medium"
  }
}
```

**Announcement Notification:**
```json
{
  "title": "Monthly Estate Meeting",
  "body": "All residents are invited...",
  "data": {
    "type": "announcement",
    "announcement_id": "announcement-uuid",
    "announcement_type": "event"
  }
}
```

**Payment Reminder Notification:**
```json
{
  "title": "Payment Reminder",
  "body": "Payment of ₦50,000 due by 2024-01-31",
  "data": {
    "type": "payment_reminder",
    "announcement_id": "announcement-uuid",
    "amount": 50000,
    "due_date": "2024-01-31"
  }
}
```

---

## Summary

- **Access Codes**: Time-bounded visitor entry codes with usage tracking
- **Alerts**: Resident-to-resident/estate quick notifications with urgency levels
- **Announcements**: Admin-to-resident formal communications with rich content

All three features support push notifications and are estate-scoped for security and privacy.

