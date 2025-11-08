# Complete User Guide - How to Use All Features

This comprehensive guide explains how users perform all operations in the Vaultify system.

---

## Table of Contents

1. [Creating Super Admin](#1-creating-super-admin)
2. [Creating Estate Admin](#2-creating-estate-admin)
3. [Users Sign Up Based on Estate](#3-users-sign-up-based-on-their-estate)
4. [Access Code Generation and Verification](#4-access-code-generation-and-verification)
5. [Send Alert](#5-send-alert)
5A. [Send Announcement (Admin Only)](#5a-send-announcement-admin-only)
6. [Lost and Found](#6-lost-and-found)
7. [Estate Service Charge](#7-estate-service-charge)
8. [Home Service Booking/Service Providers (Artisans)](#8-home-service-booking-service-providers-artisans)
9. [Add Funds to Wallet Balance (Top Up)](#9-add-funds-to-wallet-balance-top-up)
10. [Subscription in Details](#10-subscription-in-details)

---
## 1. Creating Super Admin

### Who Can Create Super Admin?
- Only existing **Super Admins** can create new Super Admins

### Step-by-Step Process:

#### Step 1: Ensure User Exists
The user must already be registered in the system with an **ACTIVE** status.

#### Step 2: Make User Super Admin
```bash
PUT /users/{userId}/make-super-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "confirm": true
}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "role": "Super Admin",
  "message": "User promoted to Super Admin"
}
```

### What Happens:
- ✅ User's role changes to `Super Admin`
- ✅ User gets system-wide admin privileges
- ✅ Can manage all estates and users
- ✅ No estate restrictions (can access all estates)
- ✅ Can create new Estate Admins

### Super Admin Capabilities:
- Manage all estates
- Create/assign Estate Admins
- Manage all users across all estates
- Access all system data
- No estate restrictions

---

## 2. Creating Estate Admin

### Prerequisites:
- User must exist and be **ACTIVE**
- Estate must exist (Paradise Estate, Range View Estate, etc.)
- Only **Super Admins** can create Estate Admins

### Step-by-Step Process:

#### Step 1: Create Estate (If Not Exists)
```bash
POST /estates
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Paradise Estate",
  "email": "admin@paradiseestate.com",
  "address": "123 Paradise Street, Lagos, Nigeria"
}
```

**Response:**
```json
{
  "estate_id": "estate-uuid-paradise",
  "name": "Paradise Estate",
  "email": "admin@paradiseestate.com",
  "address": "123 Paradise Street, Lagos, Nigeria",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

#### Step 2: Create Another Estate (Range View Estate)
```bash
POST /estates
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Range View Estate",
  "email": "admin@rangeviewestate.com",
  "address": "456 Range View Boulevard, Lagos, Nigeria"
}
```

**Response:**
```json
{
  "estate_id": "estate-uuid-rangeview",
  "name": "Range View Estate",
  "email": "admin@rangeviewestate.com",
  "address": "456 Range View Boulevard, Lagos, Nigeria",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

#### Step 3: Make User Estate Admin for Paradise Estate
```bash
PUT /users/{userId}/make-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid-paradise"
}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "role": "Admin",
  "estate_id": "estate-uuid-paradise",
  "message": "User promoted to Estate Admin"
}
```

#### Step 4: Make Another User Estate Admin for Range View Estate
```bash
PUT /users/{userId}/make-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid-rangeview"
}
```

### What Happens:
- ✅ User's role changes to `Admin`
- ✅ User is assigned to the specified estate
- ✅ User gets admin privileges for that estate only
- ✅ Can manage users, alerts, service charges within their estate
- ✅ Cannot access other estates' data

### Estate Admin Capabilities:
- Manage users in their estate
- Send alerts to estate residents
- Validate service charge payments
- Manage lost & found items
- Register service providers for their estate
- View estate-specific reports

---

## 3. Users Sign Up Based on Their Estate

### Prerequisites:
- Estate must exist before users can register
- Users must know their estate_id

### Step-by-Step Process:

#### Step 1: User Registers with Estate ID
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "resident@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "estate-uuid-paradise"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": "user-uuid"
}
```

### What Happens:
1. ✅ User is created with `PENDING` status
2. ✅ User profile is automatically created with `estate_id` assigned
3. ✅ User profile role is set to `Residence` (default)
4. ✅ OTP is generated and sent to email
5. ✅ User can verify OTP to activate account

#### Step 2: User Verifies OTP
```bash
POST /auth/verify-otp
Content-Type: application/json

{
  "user_id": "user-uuid",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully. Please wait for admin approval to activate your account.",
  "user_id": "user-uuid",
  "status": "pending"
}
```

**Note:** After OTP verification, user status remains `pending` until admin activates them.

#### Step 3: Admin Activates User
```bash
PUT /users/{userId}/activate
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "status": "active",
  "email": "resident@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Step 4: User Can Now Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "resident@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here",
  "user": {
    "user_id": "user-uuid",
    "email": "resident@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active",
    "profile": {
      "estate_id": "estate-uuid-paradise",
      "role": "Residence"
    }
  }
}
```

### Important Notes:
- ✅ Users **must** provide `estate_id` during registration
- ✅ User profile is automatically created with estate assignment
- ✅ Users cannot register without a valid estate_id
- ✅ Admin must activate user before they can login
- ✅ Estate assignment happens automatically during registration

---

## 4. Access Code Generation and Verification

### Estate Scope Requirement:
**Estate A security must not be able to verify Estate B codes and vice versa.**

### For Residents (Generate Access Codes):

#### Step 1: Create Access Code
```bash
POST /access-codes
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "visitor_phone": "+2348012345678",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "max_uses": 5,
  "gate": "Main Gate",
  "notify_on_use": true
}
```

**Response:**
```json
{
  "code": "ABC12345",
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "visitor_phone": "+2348012345678",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "max_uses": 5,
  "current_uses": 0,
  "gate": "Main Gate",
  "is_active": true,
  "notify_on_use": true,
  "created_at": "2024-01-15T09:00:00Z",
  "creator_house_address": "Block A, Flat 101"
}
```

**Note:** 
- `creator_house_address` is automatically included from the resident's profile
- If the resident hasn't set their house address, it will be `null`

#### Step 2: View Your Access Codes
```bash
GET /access-codes
Authorization: Bearer {resident_token}
```

**Response:**
```json
[
  {
    "code": "ABC12345",
    "visitor_name": "Jane Smith",
    "valid_from": "2024-01-15T10:00:00Z",
    "valid_to": "2024-01-15T18:00:00Z",
    "max_uses": 5,
    "current_uses": 0,
    "is_active": true,
    "creator_house_address": "Block A, Flat 101"
  }
]
```

**Note:** 
- `creator_house_address` is included for each access code
- Shows the resident's house address from their profile

#### Step 3: Deactivate Access Code (If Needed)
```bash
PUT /access-codes/{code}/deactivate
Authorization: Bearer {resident_token}
```

### For Security Personnel (Verify Access Codes):

#### Step 1: Validate Access Code
```bash
POST /access-codes/validate/{code}
Authorization: Bearer {security_token}
```

**Response (If Valid):**
```json
{
  "code": "ABC12345",
  "visitor_name": "Jane Smith",
  "visitor_email": "jane@example.com",
  "visitor_phone": "+2348012345678",
  "creator_name": "John Doe",
  "creator_house_address": "Block A, Flat 101",
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "remaining_uses": 4
}
```

**Note:** 
- `creator_house_address` shows where the visitor should go (resident's house address)
- Helps security personnel direct visitors to the correct location
- If resident hasn't set their house address, it will be `null`

**Response (If Invalid/Expired):**
```json
{
  "statusCode": 400,
  "message": "Access code has expired"
}
```

### Estate Scope Implementation:
- ✅ Access codes are created by users who belong to estates
- ✅ Security personnel can only verify codes created by users in their estate
- ✅ System checks creator's estate_id against security personnel's estate_id
- ✅ Cross-estate code verification is blocked

### How It Works:
1. Resident creates access code → Code is linked to resident's estate
2. Security personnel validates code → System checks if security's estate matches creator's estate
3. If estates match → Access granted
4. If estates don't match → Access denied with error

### Important Notes:
- ✅ Codes expire based on `valid_from` and `valid_to` dates
- ✅ Codes have maximum usage limits (`max_uses`)
- ✅ Codes can be deactivated by creator
- ✅ Security personnel are estate-scoped automatically
- ✅ Cross-estate verification is prevented

---

## 5. Send Alert

### Estate Scope Requirement:
**Alerts sent from Estate A must not deliver to Estate B. Only residents in Estate A should get the alerts.**

### Who Can Send Alerts?
- **All Authenticated Users** (Residents, Admins, Security Personnel) - Can send alerts to other residents in their estate

### Purpose:
Alerts are for **residents** to quickly notify other residents in their estate about:
- Road blocks or traffic issues
- Maintenance work happening
- Emergency situations
- Utility interruptions
- General warnings or information

### Step-by-Step Process:

#### Step 1: Create Alert (Estate-Scoped)
When a resident sends an alert with `recipients.type: "estate"`, the system automatically uses their estate_id:

```bash
POST /alerts
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "message": "Road block on Main Street due to maintenance work. Please use alternative route.",
  "alert_type": "maintenance",
  "urgency_level": "high",
  "recipients": {
    "type": "estate"
  }
}
```

**Note:** When `recipients.type` is `"estate"` and no `estate_id` is provided, the system automatically uses the sender's estate. Residents cannot send alerts to other estates.

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "resident-uuid",
  "message": "Road block on Main Street due to maintenance work. Please use alternative route.",
  "alert_type": "maintenance",
  "urgency_level": "high",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid-paradise"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Recipient Types:

#### Option 1: Send to All Estate Residents (Simplified)
```json
{
  "message": "Water supply will be interrupted tomorrow from 9 AM to 3 PM for maintenance work.",
  "alert_type": "utility",
  "urgency_level": "medium",
  "recipients": {
    "type": "estate"
  }
}
```
**Note:** Estate ID is automatically set to sender's estate.

#### Option 2: Send to Specific Users in Estate
```json
{
  "message": "Your package has arrived at the reception",
  "alert_type": "general",
  "urgency_level": "medium",
  "recipients": {
    "type": "user",
    "user_ids": ["user-uuid-1", "user-uuid-2"]
  }
}
```

### Alert Types:
- `general` - General alerts/information
- `emergency` - Emergency situations
- `maintenance` - Maintenance work notices
- `security` - Security alerts
- `utility` - Utility interruptions or issues

### Urgency Levels:
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `critical` - Critical/urgent

### What Happens:
1. ✅ Alert is created in database
2. ✅ System automatically uses sender's estate_id for estate-scoped alerts
3. ✅ Only users in the same estate receive the alert
4. ✅ Push notifications are sent to all active users in the estate
5. ✅ Users receive alerts in their app

### Estate Scope Implementation:
- ✅ When `recipients.type` is `"estate"`, system automatically uses sender's `estate_id`
- ✅ Residents cannot send alerts to other estates (blocked by system)
- ✅ Only users with matching `estate_id` in their profile receive alerts
- ✅ Alerts are automatically scoped to the sender's estate
- ✅ Cross-estate alert delivery is prevented

### Viewing Alerts:

#### Get Your Alerts
```bash
GET /alerts/me?page=1&limit=20
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "data": [
    {
      "alert_id": "alert-uuid",
      "message": "Road block on Main Street due to maintenance work...",
      "alert_type": "maintenance",
      "urgency_level": "high",
      "sender": {
        "first_name": "John",
        "last_name": "Doe"
      },
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

#### Get Specific Alert
```bash
GET /alerts/{alertId}
Authorization: Bearer {resident_token}
```

#### Delete Alert (Remove from Your View)
```bash
DELETE /alerts/{alertId}
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "reason": "Already resolved"
}
```

#### Update Your Alert (Only sender can update)
```bash
PUT /alerts/{alertId}
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "message": "Updated: Road block cleared. Traffic is flowing normally now.",
  "urgency_level": "low"
}
```

#### Get Estate Alerts (Admin/Security Only)
```bash
GET /alerts/estate/{estateId}?page=1&limit=20
Authorization: Bearer {admin_token}
```

### Important Notes:
- ✅ Alerts are for **all authenticated users** (residents, admins, security) to notify other residents
- ✅ Alerts are automatically estate-scoped (sender's estate)
- ✅ Only residents in the same estate receive alerts
- ✅ Push notifications are sent automatically
- ✅ Users can delete alerts from their view
- ✅ Only the sender can update their own alerts
- ✅ Alerts are filtered by estate_id in the database
- ✅ Example use cases: Road blocks, maintenance warnings, utility interruptions

## 5A. Send Announcement (Admin Only)

### Who Can Send Announcements?
- **Estate Admins** (`Admin` role) only

### Purpose:
Announcements are **official communications** from estate admins to residents about:
- Official estate notices
- Payment reminders
- Scheduled events
- Policy changes
- Important estate updates

### Estate Scope:
- ✅ Announcements are automatically scoped to admin's estate (`estate_id`)
- ✅ Admin can only send announcements to residents in their own estate
- ✅ System automatically uses admin's estate_id when creating announcements
- ✅ Cross-estate announcements are prevented

### Step-by-Step Process:

#### Step 1: Send to All Estate Residents (With Images)
```bash
POST /announcements
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Estate Meeting Scheduled",
  "message": "There will be an estate meeting on Saturday, January 20th at 2 PM in the community hall. All residents are encouraged to attend.",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "image_urls": [
    "https://storage.example.com/announcements/meeting-poster.jpg",
    "https://storage.example.com/announcements/venue-map.png"
  ]
}
```

**Note:** 
- `image_urls` is **optional** - you can omit it if no images are needed
- Can include multiple image URLs (array of strings)
- Images should be uploaded to your storage service (S3, etc.) first, then URLs provided here

**Response:**
```json
{
  "announcement_id": "announcement-uuid",
  "sender_user_id": "admin-uuid",
  "estate_id": "estate-uuid-paradise",
  "title": "Estate Meeting Scheduled",
  "message": "There will be an estate meeting on Saturday, January 20th at 2 PM in the community hall. All residents are encouraged to attend.",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "image_urls": [
    "https://storage.example.com/announcements/meeting-poster.jpg",
    "https://storage.example.com/announcements/venue-map.png"
  ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

#### Step 2: Send to Single Resident (With Image)
```bash
POST /announcements
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Payment Reminder",
  "message": "Your service charge payment is overdue. Please make payment as soon as possible.",
  "announcement_type": "payment_reminder",
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"],
  "image_urls": [
    "https://storage.example.com/announcements/payment-instructions.jpg"
  ]
}
```

**Note:** 
- The system automatically validates that the target user belongs to the admin's estate. If not, an error is returned.
- `image_urls` is optional - can be omitted if no images needed

**Response:**
```json
{
  "announcement_id": "announcement-uuid",
  "sender_user_id": "admin-uuid",
  "estate_id": "estate-uuid-paradise",
  "title": "Payment Reminder",
  "message": "Your service charge payment is overdue. Please make payment as soon as possible.",
  "announcement_type": "payment_reminder",
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"],
  "image_urls": [
    "https://storage.example.com/announcements/payment-instructions.jpg"
  ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

#### Step 3: Send to Specific Residents (Multiple) - Without Images
```bash
POST /announcements
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Block A Meeting",
  "message": "Meeting for Block A residents scheduled for Friday.",
  "announcement_type": "event",
  "recipient_type": "specific_residents",
  "target_user_ids": ["user-uuid-1", "user-uuid-2", "user-uuid-3"]
}
```

**Note:** 
- All target users must belong to the admin's estate. The system validates each user.
- `image_urls` is optional - this example shows announcement without images

#### Step 4: Send Payment Reminder (Quick Method)
```bash
POST /announcements/payment-reminder
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "target_user_id": "user-uuid",
  "amount": 50000,
  "due_date": "2024-01-30",
  "description": "Monthly service charge payment",
  "utility_account_id": "account-uuid"
}
```

**Response:**
```json
{
  "announcement_id": "announcement-uuid",
  "title": "Payment Reminder - Monthly service charge payment",
  "message": "This is a reminder that you have a payment of ₦50,000 due by 2024-01-30. Monthly service charge payment",
  "announcement_type": "payment_reminder",
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"],
  "payment_details": {
    "amount": 50000,
    "due_date": "2024-01-30",
    "description": "Monthly service charge payment",
    "utility_account_id": "account-uuid"
  }
}
```

### Recipient Types:

#### Option 1: All Estate Residents
```json
{
  "recipient_type": "all_residents"
}
```
- All active residents in the estate receive the announcement
- No `target_user_ids` required

#### Option 2: Security Personnel Only
```json
{
  "recipient_type": "security_personnel"
}
```
- Only security personnel in the estate receive the announcement
- No `target_user_ids` required

#### Option 3: Single User
```json
{
  "recipient_type": "single_user",
  "target_user_ids": ["user-uuid"]
}
```
- Only the specified user receives the announcement
- Must provide `target_user_ids` with exactly one user ID
- System validates user belongs to admin's estate

#### Option 4: Specific Residents
```json
{
  "recipient_type": "specific_residents",
  "target_user_ids": ["user-uuid-1", "user-uuid-2"]
}
```
- Only specified users receive the announcement
- Must provide `target_user_ids` array
- System validates all users belong to admin's estate

### Announcement Types:
- `general` - General announcements
- `payment_reminder` - Payment reminders
- `maintenance` - Maintenance notices
- `event` - Event announcements
- `security` - Security announcements
- `urgent` - Urgent announcements

### What Happens:
1. ✅ Admin creates announcement
2. ✅ System automatically uses admin's `estate_id` (from admin's profile)
3. ✅ For specific users: System validates all target users belong to admin's estate
4. ✅ Announcement is created in database with estate scope
5. ✅ Push notifications are sent to all recipients
6. ✅ Only recipients in the estate receive the announcement

### Estate Scope Implementation:
- ✅ Admin's `estate_id` is automatically retrieved from their profile
- ✅ Announcement is linked to admin's estate (`estate_id`)
- ✅ Target users are validated to belong to same estate
- ✅ Cross-estate announcements are prevented
- ✅ Residents only see announcements from their estate

### Viewing Announcements:

#### Get Your Announcements (Residents)
```bash
GET /announcements/me?page=1&limit=20
Authorization: Bearer {resident_token}
```

**Response:**
```json
{
  "data": [
    {
      "announcement_id": "announcement-uuid",
      "title": "Estate Meeting Scheduled",
      "message": "There will be an estate meeting on Saturday...",
      "announcement_type": "event",
      "recipient_type": "all_residents",
      "sender": {
        "first_name": "Admin",
        "last_name": "User"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 10,
  "totalPages": 1
}
```

#### Get Specific Announcement
```bash
GET /announcements/{announcementId}
Authorization: Bearer {resident_token}
```

#### Admin: View Sent Announcements
```bash
GET /announcements/sent?page=1&limit=20
Authorization: Bearer {admin_token}
```

#### Admin: Update Announcement
```bash
PUT /announcements/{announcementId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "message": "Updated: Meeting postponed to next Saturday",
  "image_urls": [
    "https://storage.example.com/announcements/updated-image.jpg"
  ]
}
```

**Note:**
- Can update any field including `image_urls`
- `image_urls` can be updated to add, remove, or replace images
- Only the announcement creator (admin) can update

#### Admin: Delete Announcement
```bash
DELETE /announcements/{announcementId}
Authorization: Bearer {admin_token}
```

### Image Uploads:
- ✅ **Optional field**: `image_urls` - Array of image URLs
- ✅ **Multiple images**: Can upload multiple images per announcement
- ✅ **Upload process**: 
  1. Upload images to your storage service (S3, Linode Object Storage, etc.)
  2. Get the image URLs
  3. Include URLs in `image_urls` array when creating announcement
- ✅ **Use cases**: Event posters, payment instructions, maintenance photos, policy documents, etc.
- ✅ **Example**: `"image_urls": ["https://storage.example.com/image1.jpg", "https://storage.example.com/image2.png"]`

### Important Notes:
- ✅ Announcements are for **admins only**
- ✅ Announcements are official estate communications
- ✅ Automatically estate-scoped (admin's estate)
- ✅ Only residents in the same estate receive announcements
- ✅ Target users are validated to belong to admin's estate
- ✅ Cross-estate announcements are prevented
- ✅ Push notifications are sent automatically
- ✅ **Image uploads are optional** - announcements work without images
- ✅ Example use cases: Official notices, payment reminders, events, policy changes
- ✅ Single resident announcements: Use `recipient_type: "single_user"` with `target_user_ids: ["user-uuid"]`

---

## 6. Lost and Found

### Estate Scope Requirement:
**Lost & Found reports from Estate A must not deliver to Estate B. Only residents in Estate A should see the reports.**

### Step-by-Step Process:

#### Step 1: Report Lost Item
```bash
POST /lost-found
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid-paradise",
  "description": "Lost black iPhone 13 Pro Max with blue case",
  "item_type": "Lost",
  "location": "Near the swimming pool",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/lost-phone.jpg"
}
```

**Note:** The `estate_id` must match the user's estate. The system validates this to ensure users can only report items for their own estate.

**Response:**
```json
{
  "lostfound_id": "item-uuid",
  "sender_user_id": "user-uuid",
  "estate_id": "estate-uuid-paradise",
  "description": "Lost black iPhone 13 Pro Max with blue case",
  "item_type": "Lost",
  "location": "Near the swimming pool",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/lost-phone.jpg",
  "date_reported": "2024-01-15T10:00:00Z"
}
```

#### Step 2: Report Found Item
```bash
POST /lost-found
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid-paradise",
  "description": "Found a set of keys with a keychain",
  "item_type": "Found",
  "location": "Parking lot",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/found-keys.jpg"
}
```

### Estate Scope Implementation:
- ✅ Lost & Found items are automatically linked to the user's estate (`estate_id`)
- ✅ Items are filtered by `estate_id` when retrieving
- ✅ Only residents in the same estate can see items from their estate
- ✅ Cross-estate visibility is prevented

### Viewing Lost & Found Items:

#### Get Items by Estate (Estate-Scoped)
```bash
GET /lost-found/estate/{estateId}?page=1&limit=20
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "data": [
    {
      "lostfound_id": "item-uuid",
      "description": "Lost black iPhone 13 Pro Max with blue case",
      "item_type": "Lost",
      "location": "Near the swimming pool",
      "contact_info": "+2348012345678",
      "image_url": "https://storage.example.com/lost-phone.jpg",
      "date_reported": "2024-01-15T10:00:00Z",
      "sender": {
        "user_id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### Search Items in Estate
```bash
GET /lost-found/search/{estateId}?query=iphone&page=1&limit=20
Authorization: Bearer {user_token}
```

#### Get Specific Item
```bash
GET /lost-found/{itemId}
Authorization: Bearer {user_token}
```

### Item Types:
- `Lost` - Item is lost
- `Found` - Item is found

### What Happens:
1. ✅ User creates lost/found report
2. ✅ Item is automatically linked to user's estate (`estate_id`)
3. ✅ Item is stored in database with estate scope
4. ✅ Only residents in the same estate can view the item
5. ✅ Cross-estate visibility is prevented

### Important Notes:
- ✅ Items require `estate_id` in request body (must match user's estate)
- ✅ Only residents in the same estate can see items
- ✅ Items can include images and contact information
- ✅ Items are sorted by date reported (newest first)
- ✅ Estate filtering happens automatically in queries
- ✅ Users can update and delete their own items

---

## 7. Estate Service Charge

### Step-by-Step Process:

#### Step 1: Create Service Charge Record (One-Time Setup)
```bash
POST /bank-service-charges
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "service_charge": 50000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890"
}
```

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "user_id": "user-uuid",
  "service_charge": 50000,
  "paid_charge": 0,
  "outstanding_charge": 50000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890",
  "is_validated": false,
  "created_at": "2024-01-15T10:00:00Z"
}
```

#### Step 2: View Your Service Charge
```bash
GET /bank-service-charges/me
Authorization: Bearer {resident_token}
```

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "service_charge": 50000,
  "paid_charge": 20000,
  "outstanding_charge": 30000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890",
  "is_validated": false,
  "files": [
    {
      "bsc_file_id": "file-uuid",
      "file_url": "https://storage.example.com/receipt.pdf",
      "uploaded_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### Step 3: Upload Payment Receipt/Proof
**Users can only upload receipts/images. Payment amounts are updated by admins only.**
```bash
POST /bank-service-charges/me/files
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "file_url": "https://storage.example.com/bank-receipt.pdf"
}
```

### Payment Frequencies:
- `monthly` - Paid every month
- `quarterly` - Paid every 3 months
- `yearly` - Paid once per year

### Admin Operations:

#### Step 4: Admin Updates Payment Amount (Auto-calculates Outstanding Balance)
```bash
PUT /bank-service-charges/{bscId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "paid_charge": 30000,
  "is_validated": true,
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "service_charge": 50000,
  "paid_charge": 30000,
  "outstanding_charge": 20000,
  "is_validated": true,
  "validated_at": "2024-01-15T12:00:00Z",
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Note:** Estate Admins and Super Admins can update service charges. When admin updates `paid_charge` or `service_charge`, the `outstanding_charge` is automatically calculated as `service_charge - paid_charge`. If the result is negative, it's set to 0.

#### Step 5: Admin Validates Payment (Optional - Separate from update)
```bash
PUT /bank-service-charges/{bscId}/validate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_validated": true,
  "notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Note:** Estate Admins and Super Admins can validate payments. This is a separate operation from updating payment amounts.

### Payment Workflow:
- ✅ Users upload payment receipts/images only
- ✅ Admin reviews receipts and updates `paid_charge` amount
- ✅ System automatically calculates `outstanding_charge` when admin updates
- ✅ Admin can validate payments and add notes
- ✅ No direct payment processing (wallet/Paystack) through this system

### Admin Features:

#### Update Service Charge (Auto-calculates Outstanding Balance)
```bash
PUT /bank-service-charges/{bscId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "service_charge": 50000,
  "paid_charge": 30000,
  "is_validated": true,
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "service_charge": 50000,
  "paid_charge": 30000,
  "outstanding_charge": 20000,
  "is_validated": true,
  "validated_at": "2024-01-15T12:00:00Z",
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Note:** Estate Admins and Super Admins can update service charges. When admin updates `paid_charge` or `service_charge`, the system automatically calculates `outstanding_charge = service_charge - paid_charge`. If the result is negative, it's set to 0.

#### View All Service Charges in Estate
```bash
GET /bank-service-charges/estate/{estateId}?page=1&limit=20
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "data": [
    {
      "bsc_id": "bsc-uuid",
      "user_id": "user-uuid",
      "service_charge": 50000,
      "paid_charge": 30000,
      "outstanding_charge": 20000,
      "is_validated": false,
      "user": {
        "user_id": "user-uuid",
        "email": "resident@example.com",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Important Notes:
- ✅ Each user can only have ONE service charge record
- ✅ **Users CANNOT pay directly** - they can only upload payment receipts/images
- ✅ Users can only update bank details (bank_name, account_name, account_number, payment_frequency)
- ✅ **Estate Admin/Super Admin updates payment amounts** - Admin uses `PUT /bank-service-charges/{bscId}` to update `paid_charge`
- ✅ **Outstanding balance auto-calculates** - When admin updates `paid_charge` or `service_charge`, system automatically calculates `outstanding_charge = service_charge - paid_charge`
- ✅ Estate Admin/Super Admin can validate payments and add validation notes
- ✅ Estate-scoped: Estate Admins only see their estate's charges

---

## 8. Home Service Booking/Service Providers (Artisans)

### Process Flow:
1. **Estate Admin registers service provider** → Provider becomes available in app
2. **Resident searches/browses providers** → Finds suitable artisan
3. **Resident contacts provider** → Books service via phone/contact info

### Step-by-Step Process:

#### Step 1: Estate Admin Registers Service Provider
```bash
POST /service-directory/providers
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "service_id": "service-uuid",
  "estate_id": "estate-uuid-paradise",
  "first_name": "Michael",
  "last_name": "Adeyemi",
  "phone": "+2348012345678",
  "location": "Lagos",
  "availability": "Mon-Fri, 9 AM - 6 PM",
  "bio": "Experienced plumber with 10 years of experience",
  "skill": "Plumbing, Pipe Repair, Installation",
  "profile_picture_url": "https://storage.example.com/provider-photo.jpg",
  "photos": [
    "https://storage.example.com/work-photo-1.jpg",
    "https://storage.example.com/work-photo-2.jpg",
    "https://storage.example.com/work-photo-3.jpg"
  ]
}
```

**Note:** 
- `profile_picture_url` - Single profile picture for the provider
- `photos` - Array of up to 5 photo URLs to showcase their work (optional)

**Response:**
```json
{
  "provider_id": "provider-uuid",
  "service_id": "service-uuid",
  "admin_user_id": "admin-uuid",
  "estate_id": "estate-uuid-paradise",
  "first_name": "Michael",
  "last_name": "Adeyemi",
  "phone": "+2348012345678",
  "location": "Lagos",
  "availability": "Mon-Fri, 9 AM - 6 PM",
  "bio": "Experienced plumber with 10 years of experience",
  "skill": "Plumbing, Pipe Repair, Installation",
  "profile_picture_url": "https://storage.example.com/provider-photo.jpg",
  "created_at": "2024-01-15T10:00:00Z",
  "photos": [
    {
      "provider_photo_id": "photo-uuid-1",
      "image_url": "https://storage.example.com/work-photo-1.jpg",
      "uploaded_at": "2024-01-15T10:00:00Z"
    },
    {
      "provider_photo_id": "photo-uuid-2",
      "image_url": "https://storage.example.com/work-photo-2.jpg",
      "uploaded_at": "2024-01-15T10:00:00Z"
    },
    {
      "provider_photo_id": "photo-uuid-3",
      "image_url": "https://storage.example.com/work-photo-3.jpg",
      "uploaded_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Step 2: Get Available Services
```bash
GET /service-directory/services
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "data": [
    {
      "service_id": "service-uuid",
      "name": "Plumber"
    },
    {
      "service_id": "service-uuid-2",
      "name": "Electrician"
    },
    {
      "service_id": "service-uuid-3",
      "name": "Carpenter"
    }
  ]
}
```

#### Step 3: Resident Searches Providers by Service
```bash
GET /service-directory/providers/service/{serviceId}?estate_id={estateId}&page=1&limit=20
Authorization: Bearer {resident_token}
```

**Response:**
```json
{
  "data": [
    {
      "provider_id": "provider-uuid",
      "first_name": "Michael",
      "last_name": "Adeyemi",
      "phone": "+2348012345678",
      "location": "Lagos",
      "availability": "Mon-Fri, 9 AM - 6 PM",
      "bio": "Experienced plumber with 10 years of experience",
      "skill": "Plumbing, Pipe Repair, Installation",
      "profile_picture_url": "https://storage.example.com/provider-photo.jpg",
      "service": {
        "service_id": "service-uuid",
        "name": "Plumber"
      },
      "photos": [
        {
          "provider_photo_id": "photo-uuid-1",
          "image_url": "https://storage.example.com/work-photo-1.jpg",
          "uploaded_at": "2024-01-15T10:00:00Z"
        },
        {
          "provider_photo_id": "photo-uuid-2",
          "image_url": "https://storage.example.com/work-photo-2.jpg",
          "uploaded_at": "2024-01-15T10:00:00Z"
        }
      ],
      "reviews": [
        {
          "rating": 5,
          "comment": "Excellent service!",
          "reviewer_name": "John Doe"
        }
      ]
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### Step 4: Search Providers
```bash
GET /service-directory/providers/search?query=plumber&estate_id={estateId}
Authorization: Bearer {resident_token}
```

#### Step 5: Get Provider Details
```bash
GET /service-directory/providers/{providerId}
Authorization: Bearer {resident_token}
```

**Response:**
```json
{
  "provider_id": "provider-uuid",
  "first_name": "Michael",
  "last_name": "Adeyemi",
  "phone": "+2348012345678",
  "location": "Lagos",
  "availability": "Mon-Fri, 9 AM - 6 PM",
  "bio": "Experienced plumber with 10 years of experience",
  "skill": "Plumbing, Pipe Repair, Installation",
  "profile_picture_url": "https://storage.example.com/provider-photo.jpg",
  "service": {
    "service_id": "service-uuid",
    "name": "Plumber"
  },
  "photos": [
    {
      "provider_photo_id": "photo-uuid-1",
      "image_url": "https://storage.example.com/work-photo-1.jpg",
      "uploaded_at": "2024-01-15T10:00:00Z"
    },
    {
      "provider_photo_id": "photo-uuid-2",
      "image_url": "https://storage.example.com/work-photo-2.jpg",
      "uploaded_at": "2024-01-15T10:00:00Z"
    }
  ],
  "reviews": [
    {
      "review_id": "review-uuid",
      "reviewer_name": "John Doe",
      "rating": 5,
      "comment": "Excellent service! Fixed my leaky faucet quickly.",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### Step 6: Resident Leaves Review (After Service)
```bash
POST /service-directory/providers/{providerId}/reviews
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "reviewer_name": "John Doe",
  "rating": 5,
  "comment": "Excellent service! Fixed my leaky faucet quickly."
}
```

### Estate Scope:
- ✅ Providers are registered by estate admins
- ✅ Providers are linked to estates (`estate_id`)
- ✅ Residents can filter providers by estate
- ✅ Providers are only visible to residents in their estate (or all estates if not filtered)

### Admin Features:

#### Update Provider
```bash
PUT /service-directory/providers/{providerId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "phone": "+2348098765432",
  "availability": "Mon-Sat, 8 AM - 7 PM"
}
```

#### Delete Provider
```bash
DELETE /service-directory/providers/{providerId}
Authorization: Bearer {admin_token}
```

#### Add Provider Photo (After Creation)
```bash
POST /service-directory/providers/{providerId}/photos
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "image_url": "https://storage.example.com/new-photo.jpg"
}
```

**Note:** Maximum 5 photos per provider. If provider already has 5 photos, you must delete one first.

#### Delete Provider Photo
```bash
DELETE /service-directory/providers/{providerId}/photos/{photoId}
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

### Important Notes:
- ✅ Providers are registered by estate admins only
- ✅ Providers are available to residents in the app
- ✅ Residents can search, browse, and contact providers
- ✅ Residents can leave reviews after service
- ✅ Providers can be filtered by estate
- ✅ **Photos**: Up to 5 photos can be uploaded to showcase work (separate from profile picture)
- ✅ Photos can be added during provider creation (`photos` array) or added later via API
- ✅ Maximum 5 photos enforced - must delete existing photo before adding new one if limit reached

---

## 9. Add Funds to Wallet Balance (Top Up)

### Step-by-Step Process:

#### Step 1: Check Wallet Balance
```bash
GET /wallets/me
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "wallet_id": "wallet-uuid",
  "user_id": "user-uuid",
  "available_balance": 5000.00,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Step 2: Top Up Wallet via Paystack
```bash
POST /wallets/topup
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "amount": 10000,
  "payment_method": "paystack"
}
```

**Response:**
```json
{
  "payment_id": "payment-uuid",
  "reference": "TOPUP_abc123xyz",
  "amount": 10000,
  "status": "pending",
  "payment_url": "https://paystack.com/pay/TOPUP_abc123xyz"
}
```

#### Step 3: User Completes Payment
- User is redirected to Paystack payment page
- User enters card details or selects bank transfer
- Payment is processed

#### Step 4: Payment Confirmation (Automatic)
- Paystack webhook confirms payment
- Wallet is automatically credited
- Transaction record is created

#### Step 5: Verify Updated Balance
```bash
GET /wallets/me
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "wallet_id": "wallet-uuid",
  "user_id": "user-uuid",
  "available_balance": 15000.00,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Step 6: View Transaction History
```bash
GET /wallets/me/transactions?page=1&limit=20
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "data": [
    {
      "wallet_txn_id": "txn-uuid",
      "wallet_id": "wallet-uuid",
      "amount": "10000.00",
      "direction": "CREDIT",
      "purpose": "TOP_UP",
      "reference": "TOPUP_abc123xyz",
      "status": "completed",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### Payment Methods:
- `paystack` - Paystack payment gateway (card/bank transfer)
- `card` - Direct card payment
- `transfer` - Bank transfer

### Transaction Purposes:
- `TOP_UP` - Wallet top-up
- `TRANSFER` - User-to-user transfer
- `WITHDRAWAL` - Withdrawal from wallet
- `SERVICE_CHARGE_PAYMENT` - Service charge payment
- `UTILITY_PAYMENT` - Utility bill payment
- `SUBSCRIPTION_PAYMENT` - Subscription payment

### Transaction Status:
- `pending` - Transaction pending
- `completed` - Transaction completed
- `failed` - Transaction failed

### Wallet Transfer (User-to-User):
```bash
POST /wallets/transfer
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "recipient_user_id": "recipient-uuid",
  "amount": 5000,
  "purpose": "Payment for services"
}
```

### Important Notes:
- ✅ Minimum balance: ₦100
- ✅ All transactions are atomic (database transactions)
- ✅ Unique reference for each transaction
- ✅ Automatic balance updates
- ✅ Real-time balance validation
- ✅ Transaction history tracking

---

## 10. Subscription in Details

### Step-by-Step Process:

#### Step 1: View Available Plans
```bash
GET /subscriptions/plans
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "data": [
    {
      "plan_id": "plan-uuid-1",
      "code": "NORMAL_MONTHLY",
      "name": "Normal Monthly Plan",
      "type": "normal",
      "price_ngn": 5000,
      "billing_cycle": "monthly",
      "max_members": 1,
      "features": [
        "Access to all basic features",
        "Estate alerts",
        "Lost & Found",
        "Access codes"
      ]
    },
    {
      "plan_id": "plan-uuid-2",
      "code": "FAMILY_YEARLY",
      "name": "Family Yearly Plan",
      "type": "family",
      "price_ngn": 50000,
      "billing_cycle": "yearly",
      "max_members": 5,
      "features": [
        "Access to all features",
        "Up to 5 family members",
        "Priority support",
        "Advanced features"
      ]
    }
  ]
}
```

#### Step 2: Activate Subscription (Wallet Payment)
```bash
POST /subscriptions/activate
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "plan_id": "plan-uuid-1",
  "payment_method": "wallet"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid",
    "user_id": "user-uuid",
    "plan_id": "plan-uuid-1",
    "status": "active",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "success",
    "reference": "SUB_abc123",
    "paid_at": "2024-01-15T10:00:00Z"
  },
  "payment_url": null
}
```

#### Step 3: Activate Subscription (External Payment)
```bash
POST /subscriptions/activate
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "plan_id": "plan-uuid-1",
  "payment_method": "external"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid",
    "user_id": "user-uuid",
    "plan_id": "plan-uuid-1",
    "status": "pending",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "pending",
    "reference": "SUB_xyz789"
  },
  "payment_url": "https://paystack.com/pay/SUB_xyz789"
}
```

#### Step 4: View Your Subscription
```bash
GET /subscriptions/me
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "subscription_id": "sub-uuid",
  "user_id": "user-uuid",
  "plan_id": "plan-uuid-1",
  "status": "active",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-02-15T10:00:00Z",
  "expired_date": null,
  "is_free_subscription": false,
  "granted_by_admin": null,
  "plan": {
    "plan_id": "plan-uuid-1",
    "name": "Normal Monthly Plan",
    "type": "normal",
    "price_ngn": 5000,
    "billing_cycle": "monthly"
  }
}
```

**Note:** 
- `expired_date` is automatically set when subscription expires
- `is_free_subscription` indicates if subscription was granted by admin
- `granted_by_admin` shows which admin granted the subscription (if applicable)

#### Step 5: Check User Profile Subscription Status

The user profile automatically syncs subscription status:
```bash
GET /users/me
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "profile": {
    "user_id": "user-uuid",
    "isSubscribe": true,
    "subscription_start_date": "2024-01-15T10:00:00Z",
    "subscription_expiry_date": "2024-02-15T10:00:00Z",
    ...
  }
}
```

**Note:** 
- `isSubscribe` is automatically `true` when subscription is active and not expired
- `isSubscribe` automatically becomes `false` when subscription expires or is canceled
- Subscription dates sync automatically with profile

#### Step 6: Check if Subscription is Active
```bash
GET /subscriptions/me/active
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "has_active_subscription": true,
  "subscription": {
    "subscription_id": "sub-uuid",
    "status": "active",
    "end_date": "2024-02-15T10:00:00Z"
  }
}
```

#### Step 7: Renew Subscription
```bash
PUT /subscriptions/renew
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "payment_method": "wallet"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid",
    "status": "active",
    "start_date": "2024-02-15T10:00:00Z",
    "end_date": "2024-03-15T10:00:00Z",
    "expired_date": null,
    "is_free_subscription": false
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "success"
  }
}
```

**Note:** 
- `expired_date` is cleared (`null`) when subscription is renewed
- `isSubscribe` remains `true` after renewal

#### Step 8: Cancel Subscription
```bash
PUT /subscriptions/cancel
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "subscription_id": "sub-uuid",
  "status": "canceled",
  "message": "Subscription canceled successfully"
}
```

**Note:**
- `isSubscribe` in user profile automatically becomes `false` when subscription is canceled
- Subscription dates remain in profile but `isSubscribe` reflects cancellation

### Family Plan Features:

**Important:** Family plans work differently from normal plans:
- **Family Head** pays: ₦2,000/month or ₦20,000/year (full price)
- **Family Members** (up to 4 others) pay: ₦1,000/month or ₦10,000/year (half price)
- **Each member has their own subscription** - they don't share one subscription
- Members must activate their own subscription after being added to the family group

#### Step 1: Activate Family Plan (Head User)
```bash
POST /subscriptions/activate
Authorization: Bearer {head_user_token}
Content-Type: application/json

{
  "plan_id": "plan-uuid-2",
  "payment_method": "wallet"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid-head",
    "user_id": "head-user-uuid",
    "plan_id": "plan-uuid-2",
    "status": "active",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z",
    "is_family_member": false,
    "price_paid": 2000,
    "head_price": 2000
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 2000,
    "status": "success"
  }
}
```

**Note:** 
- Head pays full price (₦2,000/month or ₦20,000/year)
- Family group is automatically created when head activates family plan
- After activating, head can add family members

#### Step 2: View Family Group
```bash
GET /subscriptions/family/group
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "group_id": "group-uuid",
  "head_user_id": "user-uuid",
  "plan_id": "plan-uuid-2",
  "members": [
    {
      "member_id": "member-uuid",
      "user_id": "user-uuid",
      "is_head": true
    },
    {
      "member_id": "member-uuid-2",
      "user_id": "member-uuid-1",
      "is_head": false
    }
  ]
}
```

#### Step 3: Add Family Member (Head Only)
```bash
POST /subscriptions/family/members
Authorization: Bearer {head_user_token}
Content-Type: application/json

{
  "user_id": "new-member-uuid"
}
```

**Response:**
```json
{
  "family_member_id": "member-uuid",
  "family_group_id": "group-uuid",
  "user_id": "new-member-uuid",
  "is_head": false,
  "subscription_required": true,
  "member_price": 1000,
  "billing_cycle": "monthly",
  "message": "Family member added. Member must activate their subscription by paying ₦1000.00 (monthly)"
}
```

**Note:**
- Member must NOT have an active subscription (they need to cancel existing one first)
- A pending subscription is automatically created for the member
- Member needs to activate their subscription by paying member price (₦1,000/month or ₦10,000/year)
- Member will receive notification to activate their subscription

#### Step 4: Member Activates Their Subscription
After being added to family group, the member must activate their subscription:

```bash
POST /subscriptions/activate
Authorization: Bearer {member_user_token}
Content-Type: application/json

{
  "plan_id": "plan-uuid-2",
  "payment_method": "wallet"
}
```

**Response:**
```json
{
  "subscription": {
    "subscription_id": "sub-uuid-member",
    "user_id": "member-user-uuid",
    "plan_id": "plan-uuid-2",
    "status": "active",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-02-15T10:00:00Z",
    "is_family_member": true,
    "price_paid": 1000,
    "head_price": 2000
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 1000,
    "status": "success"
  }
}
```

**Note:**
- Member pays half price (₦1,000/month or ₦10,000/year)
- System automatically detects member status and applies member pricing
- Pending subscription created when member was added is now activated

#### Step 5: Remove Family Member
```bash
DELETE /subscriptions/family/members
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "user_id": "member-to-remove-uuid"
}
```

### Plan Types:
- `normal` - Single user plan (max 1 member)
- `family` - Family plan (max 5 members)

### Billing Cycles:
- `monthly` - Monthly billing
- `yearly` - Yearly billing

### Subscription Status:
- `pending` - Subscription pending payment (for external payments)
- `active` - Subscription active and valid
- `expired` - Subscription has expired (automatically marked when end_date passes)
- `canceled` - Subscription was manually canceled
- `paused` - Subscription is temporarily paused

### Payment Methods:
- `wallet` - Payment from wallet balance (instant activation, syncs `isSubscribe` immediately)
- `external` - Payment via Paystack (creates pending subscription, activates when payment webhook confirms)

### Subscription Expiration Tracking:
- ✅ **Automatic Expiration**: System checks for expired subscriptions every hour via cron job
- ✅ **Expired Date Tracking**: `expired_date` is automatically set when subscription expires
- ✅ **Profile Sync**: `isSubscribe` in user profile automatically updates to `false` when subscription expires
- ✅ **Real-time Check**: When fetching active subscription, system checks if it has expired and updates status
- ✅ **Payment Webhook**: External payments automatically activate subscription when payment is confirmed

### Family Group Rules:
- ✅ **Head user (creator) cannot be removed**
- ✅ **Max 5 members per family plan** (1 head + 4 members)
- ✅ **Each member has their own subscription** - they don't share one subscription
- ✅ **Head pays full price**: ₦2,000/month or ₦20,000/year
- ✅ **Members pay half price**: ₦1,000/month or ₦10,000/year
- ✅ **Only head can add/remove members**
- ✅ **Members must activate their own subscription** after being added
- ✅ **Family members must be in same estate**
- ✅ **Member must cancel existing subscription** before joining family plan

### Admin Operations (Super Admin Only):

#### Grant Free Subscription
Super Admins can grant free subscriptions to users with custom duration:

```bash
POST /subscriptions/admin/grant-free
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "user_id": "user-uuid",
  "plan_id": "plan-uuid-1",
  "duration_days": 30
}
```

**Response:**
```json
{
  "subscription_id": "sub-uuid",
  "user_id": "user-uuid",
  "plan_id": "plan-uuid-1",
  "status": "active",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-02-14T10:00:00Z",
  "expired_date": null,
  "is_free_subscription": true,
  "granted_by_admin": "admin-uuid",
  "plan": {
    "plan_id": "plan-uuid-1",
    "name": "Normal Monthly Plan",
    "type": "normal",
    "price_ngn": 5000,
    "billing_cycle": "monthly"
  }
}
```

**Note:**
- User must not have an active subscription (cancel existing one first if needed)
- `duration_days` can be any positive number (e.g., 7, 30, 90, 365)
- Subscription is immediately active
- `isSubscribe` in user profile is automatically set to `true`
- Works with both normal and family plans

#### Manually Check Expired Subscriptions
Admins can manually trigger expiration check:

```bash
POST /subscriptions/admin/check-expired
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "checked": 150,
  "expired": 5,
  "subscription_ids": [
    "sub-uuid-1",
    "sub-uuid-2",
    "sub-uuid-3",
    "sub-uuid-4",
    "sub-uuid-5"
  ]
}
```

**Note:** 
- Cron job runs automatically every hour, but admins can trigger manual check
- Updates `expired_date` and sets `isSubscribe` to `false` for expired subscriptions

### Important Notes:
- ✅ **Automatic Expiration**: System checks for expired subscriptions every hour (cron job)
- ✅ **Expired Date Tracking**: `expired_date` field is automatically set and updated when subscription expires
- ✅ **Profile Sync**: `isSubscribe` in user profile automatically syncs with subscription status
- ✅ **Auto Update**: `isSubscribe` becomes `false` automatically when subscription expires or is canceled
- ✅ **Payment Activation**: External payments automatically activate subscription when webhook confirms payment
- ✅ **Real-time Validation**: Fetching active subscription checks expiration and updates if needed
- ✅ **Renewal**: Renewing subscription clears `expired_date` and extends `end_date`
- ✅ **Free Subscriptions**: Super Admins can grant free subscriptions with custom duration
- ✅ **Family Plans**: 
  - Head pays ₦2,000/month or ₦20,000/year
  - Members pay ₦1,000/month or ₦10,000/year
  - Each member has their own subscription (not shared)
  - Member pricing is automatically applied when member activates/renews
- ✅ **Wallet Payments**: Activate instantly and sync profile immediately
- ✅ **External Payments**: Create pending subscription, activate when payment confirmed via webhook

### Subscription Lifecycle:
1. **Activation**: User activates subscription → Status becomes `active` → `isSubscribe` becomes `true`
   - **Family Head**: Pays full price (₦2,000/month or ₦20,000/year)
   - **Family Member**: Pays half price (₦1,000/month or ₦10,000/year) - automatically detected
2. **Renewal**: User renews subscription → `end_date` extended → `expired_date` cleared → `isSubscribe` remains `true`
   - **Family Head**: Pays full price on renewal
   - **Family Member**: Pays half price on renewal
3. **Expiration**: Cron job checks hourly → Finds expired subscriptions → Sets `expired_date` → Status becomes `expired` → `isSubscribe` becomes `false`
4. **Cancellation**: User cancels → Status becomes `canceled` → `isSubscribe` becomes `false`
5. **Free Grant**: Admin grants free subscription → Status immediately `active` → `isSubscribe` becomes `true`
6. **Family Member Addition**: Head adds member → Pending subscription created → Member activates by paying member price → Status becomes `active`

---

## Summary

### Estate Scoping Summary:
- ✅ **Access Codes**: Scoped to creator's estate (security can only verify their estate's codes)
- ✅ **Alerts**: Scoped to sender's estate (residents can alert other residents in their estate)
- ✅ **Lost & Found**: Scoped to reporter's estate (only estate residents see items)
- ✅ **Service Charges**: Scoped to user's estate (admins see only their estate's charges)
- ✅ **Service Providers**: Scoped to estate (registered by estate admins, visible to estate residents)

### Key Distinctions:
- **Alerts** - For **all authenticated users** (residents, admins, security) to quickly notify other residents in their estate (e.g., road blocks, maintenance warnings, utility interruptions)
- **Announcements** - For **admins only** to send official estate communications (e.g., payment reminders, events, policy changes)

### Common Patterns:
1. **Admin Operations**: Require `Admin` or `Super Admin` role (create estates, make admins, send announcements, validate payments, grant free subscriptions)
2. **Resident Operations**: All authenticated users can perform (alerts, lost & found, service charges, wallet operations, subscriptions)
3. **Estate Scoping**: All features automatically filter by `estate_id` (alerts, lost & found, service charges, providers)
4. **Payment Methods**: Wallet (instant) or External (Paystack with webhook activation)
5. **User Activation**: Admin must activate users after OTP verification
6. **Notifications**: Automatic push notifications for alerts and important events
7. **Lost & Found**: Requires `estate_id` in request body (must match user's estate)
8. **Family Plans**: 
   - Head activates plan and pays full price (₦2,000/month or ₦20,000/year)
   - Members are added separately and must activate their own subscription
   - Members pay half price (₦1,000/month or ₦10,000/year)
   - Each member has their own subscription (not shared)
9. **Subscription Tracking**: `isSubscribe` automatically syncs with subscription status, expiration tracked via `expired_date`
10. **Automated Systems**: Cron jobs handle subscription expiration checks hourly
11. **Family Member Pricing**: System automatically detects family member status and applies 50% discount on activation and renewal

### Role-Based Access:
- **Super Admin**: Can manage all estates and users
- **Estate Admin**: Can manage their estate (users, announcements, service charges, providers)
- **Security Personnel**: Can verify access codes for their estate
- **Residents**: Can send alerts, report lost & found, upload service charge receipts, book services

---

**Last Updated:** January 2024  
**Version:** 1.3

### Changelog:
- **v1.3** (January 2024): 
  - Added `creator_house_address` to access code responses (create, get, validate)
  - Updated documentation to reflect house address in all access code endpoints
- **v1.2** (January 2024): 
  - Added subscription expiration tracking (`expired_date` field)
  - Added automatic `isSubscribe` synchronization with subscription status
  - Added admin free subscription feature (Super Admin can grant subscriptions with custom duration)
  - Added automated cron job for subscription expiration checks (runs every hour)
  - Added manual expiration check endpoint for admins
  - Updated payment webhook to automatically activate subscriptions
  - Updated subscription lifecycle documentation
  - Updated family plan pricing (head pays full price, members pay half price)
- **v1.1** (January 2024): 
  - Updated service charge workflow (users upload receipts, admins update amounts)
  - Fixed alerts/announcements logic (alerts for residents, announcements for admins)
  - Added service provider photos field (up to 5 uploads)
  - Updated Lost & Found to require `estate_id` in request body
  - Updated Family Plans (members added separately after activation)
  - Added optional image uploads for admin announcements
  - Added service charge attachment to user responses (by estate/by ID)
- **v1.0** (January 2024): Initial complete user guide

