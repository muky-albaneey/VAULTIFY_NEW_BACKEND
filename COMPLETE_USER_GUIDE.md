# Complete User Guide - How to Use All Features

This comprehensive guide explains how users perform all operations in the Vaultify system.

---

## Table of Contents

1. [Creating Super Admin](#1-creating-super-admin)
2. [Creating Estate Admin](#2-creating-estate-admin)
3. [Users Sign Up Based on Estate](#3-users-sign-up-based-on-their-estate)
4. [Access Code Generation and Verification](#4-access-code-generation-and-verification)
5. [Send Alert](#5-send-alert)
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
  "created_at": "2024-01-15T09:00:00Z"
}
```

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
    "is_active": true
  }
]
```

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
  "valid_from": "2024-01-15T10:00:00Z",
  "valid_to": "2024-01-15T18:00:00Z",
  "remaining_uses": 4
}
```

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
- **Estate Admins** (`Admin` role)
- **Security Personnel** (`Security Personnel` role)

### Step-by-Step Process:

#### Step 1: Create Alert (Estate-Scoped)
```bash
POST /alerts
Authorization: Bearer {admin_or_security_token}
Content-Type: application/json

{
  "message": "Water supply will be interrupted tomorrow from 9 AM to 3 PM for maintenance work.",
  "alert_type": "utility",
  "urgency_level": "medium",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid-paradise"
  }
}
```

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "admin-uuid",
  "message": "Water supply will be interrupted tomorrow from 9 AM to 3 PM for maintenance work.",
  "alert_type": "utility",
  "urgency_level": "medium",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid-paradise"
  },
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Recipient Types:

#### Option 1: Send to All Estate Residents
```json
{
  "message": "Estate meeting scheduled for Saturday at 2 PM",
  "alert_type": "general",
  "urgency_level": "low",
  "recipients": {
    "type": "estate",
    "estate_id": "estate-uuid-paradise"
  }
}
```

#### Option 2: Send to Specific Users
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

#### Option 3: Send to All Users (System-Wide)
```json
{
  "message": "System maintenance scheduled tonight",
  "alert_type": "general",
  "urgency_level": "low",
  "recipients": {
    "type": "all"
  }
}
```

### Alert Types:
- `general` - General announcements
- `emergency` - Emergency alerts
- `maintenance` - Maintenance notices
- `security` - Security alerts
- `utility` - Utility-related alerts

### Urgency Levels:
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `critical` - Critical/urgent

### What Happens:
1. ✅ Alert is created in database
2. ✅ System identifies recipients based on `recipients.type`
3. ✅ For estate-scoped alerts: Only users in the specified estate receive the alert
4. ✅ Push notifications are sent to all active users in the estate
5. ✅ Users receive alerts in their app

### Estate Scope Implementation:
- ✅ When `recipients.type` is `"estate"`, system filters users by `estate_id`
- ✅ Only users with matching `estate_id` in their profile receive alerts
- ✅ Alerts are automatically scoped to the estate
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
      "message": "Water supply will be interrupted tomorrow...",
      "alert_type": "utility",
      "urgency_level": "medium",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### Get Estate Alerts (Admin/Security Only)
```bash
GET /alerts/estate/{estateId}?page=1&limit=20
Authorization: Bearer {admin_token}
```

### Important Notes:
- ✅ Alerts are estate-scoped automatically
- ✅ Only residents in the specified estate receive alerts
- ✅ Push notifications are sent automatically
- ✅ Users can delete alerts from their view
- ✅ Alerts are filtered by estate_id in the database

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
  "description": "Lost black iPhone 13 Pro Max with blue case",
  "item_type": "Lost",
  "location": "Near the swimming pool",
  "contact_info": "+2348012345678",
  "image_url": "https://storage.example.com/lost-phone.jpg"
}
```

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
- ✅ Items are automatically estate-scoped based on reporter's estate
- ✅ Only residents in the same estate can see items
- ✅ Items can include images and contact information
- ✅ Items are sorted by date reported (newest first)
- ✅ Estate filtering happens automatically in queries

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

#### Step 3: Make Payment via Wallet
```bash
POST /bank-service-charges/me/pay
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "payment_method": "wallet",
  "amount": 30000
}
```

**Response:**
```json
{
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 30000,
    "status": "success",
    "reference": "BSC_abc123",
    "paid_at": "2024-01-15T12:00:00Z"
  },
  "bank_service_charge": {
    "service_charge": 50000,
    "paid_charge": 30000,
    "outstanding_charge": 20000
  },
  "payment_url": null
}
```

#### Step 4: Make Payment via External Payment (Paystack)
```bash
POST /bank-service-charges/me/pay
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "payment_method": "external",
  "amount": 20000
}
```

**Response:**
```json
{
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 20000,
    "status": "pending",
    "reference": "BSC_xyz789"
  },
  "bank_service_charge": {
    "service_charge": 50000,
    "paid_charge": 30000,
    "outstanding_charge": 20000
  },
  "payment_url": "https://paystack.com/pay/BSC_xyz789"
}
```

#### Step 5: Upload Payment Proof (For External Payments)
```bash
POST /bank-service-charges/me/files
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "file_url": "https://storage.example.com/bank-receipt.pdf"
}
```

#### Step 6: Admin Validates Payment
```bash
PUT /bank-service-charges/{bscId}/validate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_validated": true,
  "notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

### Payment Frequencies:
- `monthly` - Paid every month
- `quarterly` - Paid every 3 months
- `yearly` - Paid once per year

### Payment Methods:
- `wallet` - Instant payment from wallet balance
- `external` - Payment via Paystack (card/bank transfer)

### Admin Features:

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
- ✅ Outstanding balance is automatically calculated (`outstanding = total - paid`)
- ✅ Partial payments are allowed
- ✅ Admin can validate payments
- ✅ Estate-scoped: Admins only see their estate's charges

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
  "profile_picture_url": "https://storage.example.com/provider-photo.jpg"
}
```

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
  "created_at": "2024-01-15T10:00:00Z"
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
      "photo_id": "photo-uuid",
      "image_url": "https://storage.example.com/work-photo.jpg"
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

#### Add Provider Photo
```bash
POST /service-directory/providers/{providerId}/photos
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "image_url": "https://storage.example.com/new-photo.jpg"
}
```

### Important Notes:
- ✅ Providers are registered by estate admins only
- ✅ Providers are available to residents in the app
- ✅ Residents can search, browse, and contact providers
- ✅ Residents can leave reviews after service
- ✅ Providers can be filtered by estate

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
  "plan": {
    "plan_id": "plan-uuid-1",
    "name": "Normal Monthly Plan",
    "type": "normal",
    "price_ngn": 5000,
    "billing_cycle": "monthly"
  }
}
```

#### Step 5: Check if Subscription is Active
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

#### Step 6: Renew Subscription
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
    "end_date": "2024-03-15T10:00:00Z"
  },
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 5000,
    "status": "success"
  }
}
```

#### Step 7: Cancel Subscription
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

### Family Plan Features:

#### Step 1: Activate Family Plan
```bash
POST /subscriptions/activate
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "plan_id": "plan-uuid-2",
  "payment_method": "wallet",
  "family_member_ids": ["member-uuid-1", "member-uuid-2"]
}
```

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

#### Step 3: Add Family Member
```bash
POST /subscriptions/family/members
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "user_id": "new-member-uuid"
}
```

#### Step 4: Remove Family Member
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
- `pending` - Subscription pending payment
- `active` - Subscription active
- `expired` - Subscription expired
- `canceled` - Subscription canceled

### Payment Methods:
- `wallet` - Payment from wallet balance (instant activation)
- `external` - Payment via Paystack (pending until confirmed)

### Family Group Rules:
- ✅ Head user (creator) cannot be removed
- ✅ Max 5 members per family plan
- ✅ All members share same subscription
- ✅ Only head can add/remove members
- ✅ Family members must be in same estate

### Important Notes:
- ✅ Subscriptions are automatically renewed based on billing cycle
- ✅ Users can cancel subscriptions anytime
- ✅ Family plans allow up to 5 members
- ✅ Wallet payments activate instantly
- ✅ External payments require confirmation
- ✅ Subscription expiry is tracked automatically

---

## Summary

### Estate Scoping Summary:
- ✅ **Access Codes**: Scoped to creator's estate (security can only verify their estate's codes)
- ✅ **Alerts**: Scoped to recipient estate (only estate residents receive alerts)
- ✅ **Lost & Found**: Scoped to reporter's estate (only estate residents see items)
- ✅ **Service Charges**: Scoped to user's estate (admins see only their estate's charges)
- ✅ **Service Providers**: Scoped to estate (registered by estate admins, visible to estate residents)

### Common Patterns:
1. **Admin Operations**: Require `Admin` or `Super Admin` role
2. **Estate Scoping**: All features automatically filter by `estate_id`
3. **Payment Methods**: Wallet (instant) or External (Paystack)
4. **User Activation**: Admin must activate users after OTP verification
5. **Notifications**: Automatic push notifications for alerts and important events

---

**Last Updated:** January 2024  
**Version:** 1.0

