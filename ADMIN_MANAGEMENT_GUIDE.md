# Admin Management Guide

This guide explains how to manage users, estates, and admin roles in the Vaultify system.

## Table of Contents

1. [Onboarding Users](#onboarding-users)
2. [Assigning Estate to Users](#assigning-estate-to-users)
3. [Making Someone Estate Admin](#making-someone-estate-admin)
4. [Making Someone Super Admin](#making-someone-super-admin)
5. [Activating/Suspending Users](#activatingsuspending-users)
6. [Validating Service Charges](#validating-service-charges)

---

## Onboarding Users

### Prerequisites

**IMPORTANT:** Estates must be created by admins BEFORE users can register. Users cannot register without an estate_id.

### Step 1: Admin Creates Estate (If Not Exists)

Admin first creates an estate:

```bash
POST /estates
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street, Lagos"
}
```

**Response:**
```json
{
  "estate_id": "estate-uuid",
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street, Lagos",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Step 2: User Registration (With Estate ID)

Users register with the estate_id they belong to:

```bash
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

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": "user-uuid"
}
```

**Note:** The user profile is automatically created with the estate_id assigned during registration.

### Step 3: User Verifies OTP

User verifies their email with the OTP:

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

**Note:** After OTP verification, user status remains `pending`. Admin must activate the user before they can login.

### Step 3a: Admin Activates User

Admin activates the user account:

```bash
PUT /users/{userId}/activate
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "status": "active",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

After activation, user status becomes `active` and they can login.

### Step 4: Admin Updates User Profile (Optional)

Admin can update user profile details if needed:

```bash
PUT /users/{userId}/assign-estate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid",
  "role": "Residence",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Flat 101",
  "phone_number": "+2348012345678"
}
```

**Note:** Estate is already assigned during registration, but admin can update other profile details.

---

## Assigning Estate to Users

### Endpoint: Assign Estate to User

```bash
PUT /admin/users/{userId}/assign-estate
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "estate_id": "estate-uuid",
  "role": "Residence",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Flat 101",
  "phone_number": "+2348012345678"
}
```

**Roles Available:**
- `Residence` - Regular resident
- `Security Personnel` - Security staff
- `Admin` - Estate administrator
- `Super Admin` - System administrator

**Apartment Types:**
- `Studio`
- `1-Bedroom`
- `2-Bedroom`
- `3-Bedroom`
- `4-Bedroom`
- `Penthouse`
- `Duplex`

**Response:**
```json
{
  "user_id": "user-uuid",
  "estate_id": "estate-uuid",
  "role": "Residence",
  "message": "Estate assigned successfully"
}
```

---

## Making Someone Estate Admin

### Endpoint: Make User Estate Admin

```bash
PUT /admin/users/{userId}/make-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid"
}
```

**Note:** Only Super Admins can make users Estate Admins.

**Response:**
```json
{
  "user_id": "user-uuid",
  "role": "Admin",
  "estate_id": "estate-uuid",
  "message": "User promoted to Estate Admin"
}
```

**What This Does:**
- Changes user role to `Admin`
- Assigns them to the specified estate
- Gives them admin privileges for that estate

---

## Making Someone Super Admin

### Endpoint: Make User Super Admin

```bash
PUT /admin/users/{userId}/make-super-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "confirm": true
}
```

**Note:** Only existing Super Admins can create new Super Admins.

**Response:**
```json
{
  "user_id": "user-uuid",
  "role": "Super Admin",
  "message": "User promoted to Super Admin"
}
```

**What This Does:**
- Changes user role to `Super Admin`
- Grants system-wide admin privileges
- Can manage all estates and users

**Super Admin Capabilities:**
- Manage all estates
- Create/assign Estate Admins
- Manage all users
- Access all system data
- No estate restrictions

---

## Activating/Suspending Users

Admins can activate or suspend user accounts. Users must be activated by an admin before they can login, even after OTP verification.

### Endpoint: Activate User

```bash
PUT /users/{userId}/activate
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "status": "active",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**What This Does:**
- Changes user status from `pending` to `active`
- Allows user to login and use the system
- Required after user verifies their OTP

### Endpoint: Suspend User

```bash
PUT /users/{userId}/suspend
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "status": "suspended",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**What This Does:**
- Changes user status to `suspended`
- Prevents user from logging in
- Can be reversed by activating the user again

### Endpoint: Update User Status (Generic)

You can also use the generic status update endpoint:

```bash
PUT /users/{userId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "active"  // or "suspended" or "pending"
}
```

**Status Options:**
- `pending` - User registered and verified OTP, but not yet activated by admin
- `active` - User activated by admin and can login
- `suspended` - User account suspended (cannot login)

**Response:**
```json
{
  "user_id": "user-uuid",
  "status": "active",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

---

## Validating Service Charges

### Endpoint: Get Service Charges for Estate

Estate admins can view all service charges in their estate:

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
      "paid_charge": 20000,
      "outstanding_charge": 30000,
      "payment_frequency": "monthly",
      "bank_name": "Access Bank",
      "account_name": "John Doe",
      "account_number": "1234567890",
      "user": {
        "user_id": "user-uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "files": []
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Endpoint: Validate Service Charge (Mark as Validated)

**Note:** You'll need to add this endpoint. Here's how it should work:

```bash
PUT /admin/bank-service-charges/{bscId}/validate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_validated": true,
  "notes": "Payment verified and confirmed"
}
```

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "is_validated": true,
  "validated_at": "2024-01-15T10:30:00.000Z",
  "validated_by": "admin-uuid",
  "notes": "Payment verified and confirmed"
}
```

---

## Complete User Onboarding Flow

### Full Example: Onboarding a New Resident

**Step 1: Admin Creates Estate** (If estate doesn't exist)
```bash
POST /estates
Authorization: Bearer {admin_token}
{
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street, Lagos"
}
# Response: { "estate_id": "estate-uuid", ... }
```

**Step 2: User Registers with Estate ID**
```bash
POST /auth/register
{
  "email": "newresident@example.com",
  "password": "securepassword",
  "first_name": "Jane",
  "last_name": "Smith",
  "estate_id": "estate-uuid-from-step-1"
}
# Response: { "user_id": "user-uuid", "message": "..." }
# Note: User profile is automatically created with estate_id assigned
```

**Step 3: User Verifies Email**
```bash
POST /auth/verify-otp
{
  "user_id": "user-uuid-from-step-2",
  "otp": "123456"
}
# Response: { "message": "Email verified...", "user_id": "...", "status": "pending" }
# Note: User status remains "pending" - admin must activate
```

**Step 3a: Admin Activates User**
```bash
PUT /users/{userId}/activate
Authorization: Bearer {admin_token}
# Response: { "user_id": "...", "status": "active", ... }
# User status becomes "active"
```

**Step 4: Admin Updates Profile Details** (Optional - if more details needed)
```bash
PUT /users/{userId}/assign-estate
Authorization: Bearer {admin_token}
{
  "estate_id": "estate-uuid",
  "role": "Residence",
  "apartment_type": "3-Bedroom",
  "house_address": "Block B, Flat 205",
  "phone_number": "+2348012345679"
}
```

**Step 5: User Can Now Login**
```bash
POST /auth/login
{
  "email": "newresident@example.com",
  "password": "securepassword"
}
```

---

## Complete Admin Promotion Flow

### Making Someone Estate Admin

**Step 1: User Must Exist and Be Active**
```bash
GET /users/{userId}
# Verify user exists and status is "active"
```

**Step 2: Promote to Admin**
```bash
PUT /admin/users/{userId}/make-admin
{
  "estate_id": "estate-uuid"
}
```

**Step 3: Verify Promotion**
```bash
GET /users/{userId}
# Should show role: "Admin"
```

---

## Making Someone Super Admin

**Step 1: Find Existing Super Admin Token**
You need to be logged in as a Super Admin.

**Step 2: Promote User**
```bash
PUT /admin/users/{userId}/make-super-admin
{
  "confirm": true
}
```

**Step 3: Verify**
```bash
GET /users/{userId}
# Should show role: "Super Admin"
```

---

## Service Charge Validation Workflow

**Step 1: View All Service Charges**
```bash
GET /bank-service-charges/estate/{estateId}
```

**Step 2: Review Payment Documents**
Users upload payment receipts:
```bash
POST /bank-service-charges/me/files
{
  "file_url": "https://storage.example.com/receipt.pdf"
}
```

**Step 3: Admin Validates Payment**
```bash
PUT /admin/bank-service-charges/{bscId}/validate
{
  "is_validated": true,
  "notes": "Payment verified, receipt confirmed"
}
```

---

## Roles and Permissions

### Super Admin
- ✅ Manage all estates
- ✅ Create/assign Estate Admins
- ✅ Make other Super Admins
- ✅ Manage all users
- ✅ View all data across estates
- ✅ No estate restrictions

### Estate Admin
- ✅ Manage users in their estate
- ✅ Assign estate to users
- ✅ Send announcements to estate
- ✅ View service charges in estate
- ✅ Validate service charges
- ✅ Activate/suspend estate users
- ❌ Cannot create other admins
- ❌ Cannot access other estates

### Security Personnel
- ✅ View estate announcements
- ✅ Access estate data
- ❌ Cannot manage users
- ❌ Cannot send announcements

### Residence
- ✅ View own data
- ✅ Update own profile
- ✅ View announcements addressed to them
- ❌ Cannot manage anything

---

## API Endpoints Summary

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/auth/register` | POST | Register new user | Public |
| `/auth/verify-otp` | POST | Verify email OTP | Public |
| `/users/{id}/activate` | PUT | Activate user account | Admin/Super Admin |
| `/users/{id}/suspend` | PUT | Suspend user account | Admin/Super Admin |
| `/users/{id}/status` | PUT | Update user status | Admin/Super Admin |
| `/admin/users/{id}/assign-estate` | PUT | Assign estate to user | Admin/Super Admin |
| `/admin/users/{id}/make-admin` | PUT | Make user estate admin | Super Admin |
| `/admin/users/{id}/make-super-admin` | PUT | Make user super admin | Super Admin |
| `/bank-service-charges/estate/{id}` | GET | View estate service charges | Admin |
| `/admin/bank-service-charges/{id}/validate` | PUT | Validate service charge | Admin |

---

## Common Scenarios

### Scenario 1: Bulk Onboarding

1. Create/verify users individually
2. Use `/admin/users/{id}/assign-estate` for each user
3. Or create a bulk assignment endpoint

### Scenario 2: Transfer User Between Estates

1. Get user current estate: `GET /users/{id}`
2. Update estate: `PUT /admin/users/{id}/assign-estate` with new estate_id

### Scenario 3: Demote Admin

1. Change role back: `PUT /admin/users/{id}/assign-estate` with role: "Residence"

### Scenario 4: Service Charge Dispute

1. View charge: `GET /bank-service-charges/{bscId}`
2. Review files: `GET /bank-service-charges/{bscId}/files`
3. Validate or reject: `PUT /admin/bank-service-charges/{id}/validate`

---

**Last Updated:** January 2024  
**Version:** 1.0

