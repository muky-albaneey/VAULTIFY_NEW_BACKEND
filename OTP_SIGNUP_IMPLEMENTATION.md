# OTP Sign-Up Implementation Summary

## Overview
This document describes the implementation of OTP (One-Time Password) verification for user sign-up only. Login remains unchanged and does not require OTP.

## Changes Made

### 1. User Entity Updates
**File:** `src/entities/user.entity.ts`

Added two new fields to store OTP information:
- `verification_code`: Stores the 6-digit OTP
- `verification_code_expires`: Timestamp for OTP expiration (10 minutes)

```typescript
@Column({ nullable: true })
verification_code: string;

@Column({ type: 'timestamp', nullable: true })
verification_code_expires: Date;
```

### 2. Email Service
**File:** `src/common/services/email.service.ts` (NEW)

Created a new email service using Nodemailer that:
- Sends beautiful HTML email templates for OTP verification
- Includes plain text fallback
- Supports both sign-up verification and password reset OTPs
- Handles email sending errors gracefully

### 3. Email Module
**File:** `src/common/services/email.module.ts` (NEW)

Created a global module to provide EmailService throughout the application.

### 4. Authentication Service Updates
**File:** `src/modules/auth/auth.service.ts`

#### Sign-Up Flow Changes:
1. **Registration (`register` method)**:
   - Creates user with `PENDING` status
   - Generates 6-digit OTP
   - Sets OTP expiration (10 minutes)
   - Sends OTP to user's email
   - Returns only `user_id` and message (NO tokens)
   
2. **OTP Verification (`verifyOTP` method)** (NEW):
   - Validates OTP code
   - Checks expiration
   - Updates user status to `ACTIVE`
   - Clears OTP fields
   - Generates and returns JWT tokens
   
3. **Login (`login` method)**:
   - NO OTP required
   - Only allows `ACTIVE` users to login
   - Returns error if user status is `PENDING`
   
4. **Password Reset**:
   - Generates and sends OTP for password reset
   - Validates OTP before allowing password change

### 5. Authentication Controller Updates
**File:** `src/modules/auth/auth.controller.ts`

Added new endpoint:
- `POST /auth/verify-otp`: Verify OTP and complete registration
- Updated `POST /auth/register` documentation

### 6. App Module Updates
**File:** `src/app.module.ts`

Registered `EmailModule` globally to make `EmailService` available throughout the application.

## API Endpoints

### 1. Register (Sign Up)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "estate-uuid"
}
```

**Note:** `estate_id` is required. Estates must be created by admins before users can register.

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": "uuid-here"
}
```

**What Happens:**
- User profile is automatically created with `estate_id` assigned
- User role is set to `Residence` (default)
- User can verify OTP and login with estate already assigned

### 2. Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "user_id": "uuid-here",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active"
  }
}
```

### 3. Login (NO OTP Required)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active"
  }
}
```

## User Flow

### Sign-Up Flow (With OTP)
1. User submits registration form
2. System creates user with `PENDING` status
3. System generates 6-digit OTP
4. OTP sent to user's email
5. User receives OTP via email
6. User submits OTP for verification
7. System validates OTP
8. System activates user and returns JWT tokens
9. User can now access the application

### Login Flow (Without OTP)
1. User submits credentials (email + password)
2. System validates credentials
3. System checks user status (must be ACTIVE)
4. System returns JWT tokens
5. User can access the application

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Single Use**: OTPs are cleared after successful verification
3. **Status Check**: Only `ACTIVE` users can login
4. **Email Verification**: Users must verify email before becoming active
5. **No Token on Sign-Up**: Tokens only issued after successful OTP verification

## Email Configuration (Google Workspace)

### Setup Instructions

1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password** at: https://myaccount.google.com/apppasswords
3. **Update your `.env` file**:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-16-digit-app-password
```

For detailed setup instructions, see `GOOGLE_WORKSPACE_SETUP.md`

### Important Notes:
- Use a full email address for `SMTP_USER`
- Use the 16-character App Password (not your regular password)
- Port `587` is recommended for TLS
- The email service verifies connection on startup and logs results

## Testing

### Sign-Up Test Flow:
1. Register a new user → should receive user_id and message
2. Check email → should contain 6-digit OTP
3. Try to login → should fail with "Please verify your email"
4. Verify OTP → should receive tokens
5. Login → should work successfully

## Database Migration

After deploying, you'll need to run a migration to add the new fields to the users table:

```sql
ALTER TABLE users ADD COLUMN verification_code VARCHAR;
ALTER TABLE users ADD COLUMN verification_code_expires TIMESTAMP;
```

Or use TypeORM migrations if you have migrations enabled.

## Notes

- Email service does not throw errors if email sending fails (logs to console)
- OTP codes are 6-digit numbers
- OTP expiration is set to 10 minutes
- Password reset also uses OTP (implemented but not tested in this session)
- Login flow has been explicitly updated to block PENDING users

