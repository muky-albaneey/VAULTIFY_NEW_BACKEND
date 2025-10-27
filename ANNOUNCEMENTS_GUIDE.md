# Announcements System Guide

## Overview

The Announcements system allows estate admins to send announcements to their estate residents and security personnel. This system supports multiple recipient types, payment reminders, and automatic push notifications.

## Features

### 1. **Recipient Types**
- **All Residents**: Send to all residents in your estate
- **Security Personnel**: Send to all security personnel
- **Single User**: Send to a specific resident
- **Specific Residents**: Send to multiple specific residents

### 2. **Announcement Types**
- `general` - General announcements
- `payment_reminder` - Payment reminders
- `maintenance` - Maintenance notices
- `event` - Event announcements
- `security` - Security notices
- `urgent` - Urgent announcements

### 3. **Payment Reminders**
Special functionality for sending payment reminders with amount, due date, and description.

## API Endpoints

### 1. Create Announcement
```
POST /announcements
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Announcement Title",
  "message": "Announcement message content",
  "announcement_type": "general",
  "recipient_type": "all_residents",
  "target_user_ids": ["user-id-1", "user-id-2"] // Optional, required for single_user or specific_residents
}
```

**Response:**
```json
{
  "announcement_id": "uuid",
  "sender_user_id": "uuid",
  "estate_id": "uuid",
  "title": "Announcement Title",
  "message": "Announcement message content",
  "announcement_type": "general",
  "recipient_type": "all_residents",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get My Announcements
```
GET /announcements/me?page=1&limit=20
Authorization: Bearer {token}
```

Returns all announcements visible to the authenticated user (filtered by recipient type).

### 3. Get My Sent Announcements
```
GET /announcements/sent?page=1&limit=20
Authorization: Bearer {token}
```

Returns all announcements sent by the authenticated admin (Admin only).

### 4. Get Announcement by ID
```
GET /announcements/{id}
Authorization: Bearer {token}
```

Returns a specific announcement if the user has access.

### 5. Update Announcement
```
PUT /announcements/{id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "message": "Updated message"
}
```

### 6. Delete Announcement
```
DELETE /announcements/{id}
Authorization: Bearer {token}
```

Soft deletes the announcement (Admin only).

### 7. Send Payment Reminder
```
POST /announcements/payment-reminder
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "target_user_id": "user-uuid",
  "amount": 50000,
  "due_date": "2024-01-15",
  "description": "Monthly service charge",
  "utility_account_id": "account-uuid" // Optional
}
```

**Response:**
```json
{
  "announcement_id": "uuid",
  "title": "Payment Reminder - Monthly service charge",
  "message": "This is a reminder that you have a payment of ₦50,000 due by 2024-01-15. Monthly service charge",
  "announcement_type": "payment_reminder",
  "payment_details": {
    "amount": 50000,
    "due_date": "2024-01-15",
    "description": "Monthly service charge",
    "utility_account_id": "account-uuid"
  }
}
```

## Usage Examples

### Example 1: Announce to All Residents

```json
POST /announcements

{
  "title": "Water Supply Interruption",
  "message": "Water supply will be interrupted tomorrow from 9 AM to 5 PM for maintenance work.",
  "announcement_type": "maintenance",
  "recipient_type": "all_residents"
}
```

### Example 2: Announce to Security Personnel

```json
POST /announcements

{
  "title": "Security Protocol Update",
  "message": "New security protocols are in effect. Please check your dashboard for details.",
  "announcement_type": "security",
  "recipient_type": "security_personnel"
}
```

### Example 3: Send to Single User

```json
POST /announcements

{
  "title": "Personal Notice",
  "message": "Your request has been processed. Please check your account.",
  "announcement_type": "general",
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"]
}
```

### Example 4: Send to Specific Residents

```json
POST /announcements

{
  "title": "Block A Meeting",
  "message": "There will be a meeting for Block A residents on Friday at 6 PM.",
  "announcement_type": "event",
  "recipient_type": "specific_residents",
  "target_user_ids": ["user-uuid-1", "user-uuid-2", "user-uuid-3"]
}
```

### Example 5: Send Payment Reminder

```json
POST /announcements/payment-reminder

{
  "target_user_id": "user-uuid",
  "amount": 150000,
  "due_date": "2024-01-20",
  "description": "Quarterly service charge",
  "utility_account_id": "account-uuid"
}
```

## Security & Access Control

### Admin Rights
- Only users with `Admin` role can create, update, or delete announcements
- Admins can only send announcements to users in their estate
- Admins can see all announcements they sent

### Resident Access
- Residents can only view announcements they are intended to receive
- Filtering is automatic based on recipient_type
- Residents cannot send announcements

### Security Personnel Access
- Security personnel can view announcements addressed to "all residents" or "security personnel"
- They have limited access (cannot send)

## Notifications

All announcements automatically trigger push notifications to recipients:

- **Title**: Uses the announcement title
- **Body**: Uses the announcement message
- **Data**: Includes announcement_id and announcement_type

## Database Schema

### Announcement Entity

```typescript
{
  announcement_id: string (uuid)
  sender_user_id: string
  estate_id: string
  title: string
  message: text
  announcement_type: enum
  recipient_type: enum
  target_user_ids: array (for single/specific users)
  payment_details: jsonb (for payment reminders)
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

### Recipient Types
- `all_residents` - All residents in the estate
- `security_personnel` - All security personnel
- `single_user` - One specific user
- `specific_residents` - Multiple specific users

### Announcement Types
- `general` - General announcements
- `payment_reminder` - Payment reminders
- `maintenance` - Maintenance notices
- `event` - Events
- `security` - Security notices
- `urgent` - Urgent

## Payment Reminder Special Features

When using payment reminders:
1. The title is automatically formatted: "Payment Reminder - {description}"
2. The message includes the amount formatted with currency (₦)
3. Push notifications include payment details
4. The announcement can be linked to a utility account

## Error Handling

### Common Errors

**401 Unauthorized**
- Not an admin trying to create/update/delete
- User trying to access announcement they shouldn't see

**400 Bad Request**
- Missing required fields (e.g., target_user_ids for single_user)
- Target user doesn't belong to your estate
- Invalid recipient_type for the action

**404 Not Found**
- Announcement doesn't exist
- Target user doesn't exist

## Best Practices

1. **Use Appropriate Recipient Type**
   - Use `all_residents` for general estate-wide announcements
   - Use `specific_residents` when you need to target specific people
   - Use `single_user` for personal messages

2. **Payment Reminders**
   - Always include clear due dates
   - Provide detailed descriptions
   - Use the payment_reminder type for better tracking

3. **Urgency Levels**
   - Use `urgent` type sparingly for truly urgent matters
   - Use `security` type for security-related announcements
   - Use `event` type for upcoming events

4. **Message Clarity**
   - Keep titles concise but descriptive
   - Include all relevant details in the message
   - Provide contact information if follow-up is needed

## Testing

### Test Announcement Creation
```bash
curl -X POST http://localhost:3000/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "message": "This is a test announcement",
    "announcement_type": "general",
    "recipient_type": "all_residents"
  }'
```

### Test Payment Reminder
```bash
curl -X POST http://localhost:3000/announcements/payment-reminder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": "USER_UUID",
    "amount": 50000,
    "due_date": "2024-01-20",
    "description": "Service charge payment"
  }'
```

---

**Last Updated:** January 2024  
**Version:** 1.0

