# Registration with Estate ID

## Overview

In Vaultify, **users must provide an estate_id during registration**. This ensures that:
- All users belong to an estate from the start
- Estates are managed by admins before users register
- User profiles are automatically created with estate assignment

## New Registration Flow

### 1. Admin Creates Estate (Required First Step)

**Endpoint:** `POST /estates`

```bash
POST /estates
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street, Lagos, Nigeria"
}
```

**Response:**
```json
{
  "estate_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street, Lagos, Nigeria",
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Access:** Admin, Super Admin

### 2. User Registers with Estate ID

**Endpoint:** `POST /auth/register`

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "resident@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Fields:**
- `email` (required) - User's email address
- `password` (required) - Minimum 6 characters
- `first_name` (required) - User's first name
- `last_name` (required) - User's last name
- `estate_id` (required) - UUID of the estate they belong to

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**What Happens:**
1. ✅ User is created with `PENDING` status
2. ✅ User profile is automatically created with `estate_id` assigned
3. ✅ User profile role is set to `Residence` (default)
4. ✅ OTP is generated and sent to email
5. ✅ User can verify OTP to activate account

### 3. User Verifies OTP

**Endpoint:** `POST /auth/verify-otp`

```bash
POST /auth/verify-otp
Content-Type: application/json

{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "resident@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active"
  }
}
```

After verification:
- ✅ User status changes to `active`
- ✅ User can login
- ✅ User already has estate assigned in profile

### 4. Admin Updates Profile (Optional)

If admin wants to add more details like apartment type, phone number, etc.:

**Endpoint:** `PUT /users/{userId}/assign-estate`

```bash
PUT /users/{userId}/assign-estate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "estate_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "Residence",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Flat 101",
  "phone_number": "+2348012345678"
}
```

**Note:** Estate is already assigned, but this allows updating other profile fields.

---

## Error Handling

### Invalid Estate ID

If user provides non-existent estate_id:

```json
{
  "statusCode": 400,
  "message": "Estate not found. Please provide a valid estate ID.",
  "error": "Bad Request"
}
```

### Missing Estate ID

If user doesn't provide estate_id:

```json
{
  "statusCode": 400,
  "message": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["estate_id"],
      "message": "Required"
    }
  ]
}
```

### Invalid UUID Format

If estate_id is not a valid UUID:

```json
{
  "statusCode": 400,
  "message": [
    {
      "code": "invalid_string",
      "validation": "uuid",
      "path": ["estate_id"],
      "message": "Estate ID must be a valid UUID"
    }
  ]
}
```

---

## Complete Example

### Scenario: New Resident Joining Greenview Estate

**Step 1: Admin Creates Estate**
```bash
POST /estates
{
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street"
}
# Returns: { "estate_id": "estate-123" }
```

**Step 2: User Registers**
```bash
POST /auth/register
{
  "email": "john.doe@example.com",
  "password": "secure123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "estate-123"
}
# Returns: { "user_id": "user-456", "message": "..." }
# Profile created: { "user_id": "user-456", "estate_id": "estate-123", "role": "Residence" }
```

**Step 3: User Verifies**
```bash
POST /auth/verify-otp
{
  "user_id": "user-456",
  "otp": "123456"
}
# Returns: { "access_token": "...", "refresh_token": "...", "user": {...} }
```

**Step 4: User Logs In**
```bash
POST /auth/login
{
  "email": "john.doe@example.com",
  "password": "secure123"
}
# User can login successfully with estate already assigned
```

---

## Benefits of This Approach

1. **Data Integrity** - Every user must belong to an estate
2. **Easier Management** - Admin creates estates, users just register
3. **Immediate Access** - Users can access estate features after verification
4. **No Orphaned Users** - Users can't exist without an estate
5. **Better Organization** - Clear estate-user relationship from the start

---

## Migration Notes

If you have existing users without estates:

1. Create estates for existing users
2. Use `/users/{userId}/assign-estate` to assign estates to existing users
3. Update registration flow to require estate_id going forward

---

## API Summary

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/estates` | POST | Create estate | Admin, Super Admin |
| `/auth/register` | POST | Register with estate_id | Public |
| `/auth/verify-otp` | POST | Verify email | Public |
| `/users/{id}/assign-estate` | PUT | Update profile details | Admin, Super Admin |

---

**Last Updated:** January 2024  
**Version:** 2.0

