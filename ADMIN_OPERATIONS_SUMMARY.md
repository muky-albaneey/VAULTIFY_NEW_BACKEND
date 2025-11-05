# Admin Operations Summary

## Quick Reference Guide

This document provides a quick reference for all admin operations in the Vaultify system.

---

## 1. Onboarding Users & Assigning Estate

### Process Flow:
1. **Admin Creates Estate** → `POST /estates` (if not exists)
2. **User Registers with Estate ID** → `POST /auth/register` (estate_id required)
3. **User Verifies OTP** → `POST /auth/verify-otp` (status remains "pending")
4. **Admin Activates User** → `PUT /users/{userId}/activate` (required before user can login)
5. **Admin Updates Profile** (Optional) → `PUT /users/{userId}/assign-estate`

### Assign Estate Endpoint:
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

**Access:** Admin, Super Admin

---

## 2. Making Someone Estate Admin

```bash
PUT /users/{userId}/make-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "estate_id": "estate-uuid"
}
```

**Access:** Super Admin only

**Requirements:**
- User must exist
- User must be active (not pending or suspended)
- Estate must exist

---

## 3. Making Someone Super Admin

```bash
PUT /users/{userId}/make-super-admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "confirm": true
}
```

**Access:** Super Admin only

**Requirements:**
- User must exist
- User must be active
- Confirmation flag must be true

**Note:** Super Admins have access to all estates and can manage everything.

---

## 4. Activating/Suspending Users

Users must be activated by an admin after OTP verification before they can login.

### Activate User:
```bash
PUT /users/{userId}/activate
Authorization: Bearer {admin_token}
```

### Suspend User:
```bash
PUT /users/{userId}/suspend
Authorization: Bearer {admin_token}
```

### Generic Status Update:
```bash
PUT /users/{userId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "active"  // or "suspended" or "pending"
}
```

**Access:** Admin, Super Admin

**Status Options:**
- `pending` - User verified OTP but not yet activated by admin
- `active` - User activated by admin and can login
- `suspended` - User account suspended (cannot login)

---

## 5. Validating Service Charges

### View Service Charges:
```bash
GET /bank-service-charges/estate/{estateId}?page=1&limit=20
Authorization: Bearer {admin_token}
```

### Validate Service Charge:
```bash
PUT /bank-service-charges/{bscId}/validate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_validated": true,
  "notes": "Payment verified and confirmed"
}
```

**Access:** Admin, Super Admin

**What It Does:**
- Marks service charge as validated
- Records validation timestamp
- Records admin who validated
- Allows admin notes/comments

---

## Complete Example Workflows

### Example 1: Full User Onboarding

```bash
# Step 1: Admin creates estate (if not exists)
POST /estates
Authorization: Bearer {admin_token}
{
  "name": "Greenview Estate",
  "email": "admin@greenview.com",
  "address": "123 Greenview Street"
}
# Response: { "estate_id": "estate-uuid", ... }

# Step 2: User registers with estate_id
POST /auth/register
{
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "estate_id": "estate-uuid-from-step-1"
}
# Response: { "user_id": "uuid", "message": "..." }
# Note: User profile is automatically created with estate_id

# Step 3: User verifies OTP (from email)
POST /auth/verify-otp
{
  "user_id": "uuid-from-step-2",
  "otp": "123456"
}
# Response: { "access_token": "...", "refresh_token": "...", "user": {...} }

# Step 4: Admin updates profile details (optional)
PUT /users/{userId}/assign-estate
Authorization: Bearer {admin_token}
{
  "estate_id": "estate-uuid",
  "role": "Residence",
  "apartment_type": "2-Bedroom",
  "house_address": "Block A, Flat 101",
  "phone_number": "+2348012345678"
}
```

### Example 2: Promoting User to Estate Admin

```bash
# Step 1: Ensure user is active
GET /users/{userId}
# Verify status is "active"

# Step 2: Promote to admin
PUT /users/{userId}/make-admin
{
  "estate_id": "estate-uuid"
}
# Response: { "user_id": "...", "role": "Admin", "estate_id": "...", "message": "..." }
```

### Example 3: Validating Service Charge Payment

```bash
# Step 1: View all service charges in estate
GET /bank-service-charges/estate/{estateId}

# Step 2: Review specific service charge
GET /bank-service-charges/{bscId}

# Step 3: Review payment files/receipts
GET /bank-service-charges/{bscId}/files

# Step 4: Validate payment
PUT /bank-service-charges/{bscId}/validate
{
  "is_validated": true,
  "notes": "Payment confirmed via bank statement"
}
```

---

## Role Hierarchy

### Super Admin
- ✅ Manage all estates
- ✅ Create/assign Estate Admins
- ✅ Make other Super Admins
- ✅ Manage all users across all estates
- ✅ Validate service charges in any estate
- ✅ No estate restrictions

### Estate Admin
- ✅ Manage users in their estate
- ✅ Assign estate to users
- ✅ Activate/suspend estate users
- ✅ View service charges in their estate
- ✅ Validate service charges in their estate
- ✅ Send announcements to estate
- ❌ Cannot access other estates
- ❌ Cannot create other admins

### Security Personnel
- ✅ View estate announcements
- ✅ View estate users (read-only)
- ✅ View service charges (read-only)
- ❌ Cannot manage users
- ❌ Cannot validate charges

### Residence
- ✅ View own data
- ✅ Update own profile
- ✅ View own service charges
- ❌ Cannot manage anything

---

## Important Notes

1. **User Must Be Active** - Users can only be promoted to Admin or Super Admin if their status is `active`
2. **Estate Assignment** - Users must be assigned to an estate before they can use estate-specific features
3. **Super Admin Creation** - Only existing Super Admins can create new Super Admins
4. **Service Charge Validation** - Validation records who validated and when, useful for audit trails
5. **Role Updates** - When a user's role changes, they need to log out and log back in for changes to take effect (or wait for token expiration)

---

## Database Schema Updates

### Bank Service Charge Entity (Updated)
- `is_validated` (boolean) - Whether admin has validated the payment
- `validated_at` (timestamp) - When validation occurred
- `validated_by` (string) - Admin user ID who validated
- `validation_notes` (text) - Admin notes about validation

### User Profile Entity (Updated)
- `SUPER_ADMIN` role added to UserRole enum

---

## Testing

### Test User Onboarding:
```bash
# Register → Verify → Assign Estate → Login
```

### Test Admin Promotion:
```bash
# Login as Super Admin → Promote User → Verify Role
```

### Test Service Charge Validation:
```bash
# View Charges → Validate → Check Validation Status
```

---

**For detailed API documentation, see `ADMIN_MANAGEMENT_GUIDE.md`**

**Last Updated:** January 2024

