# Admin & Super Admin Frontend Integration Guide

**For React.js Developers**

This guide provides complete API integration examples for Admin and Super Admin operations in the Vaultify system. All examples use Postman-style request/response formats for easy integration.

---

## Table of Contents

1. [Authentication & Setup](#1-authentication--setup)
2. [Estate Management (Super Admin Only)](#2-estate-management-super-admin-only)
3. [User Management](#3-user-management)
4. [Announcements (Estate Admin Only)](#4-announcements-estate-admin-only)
5. [Service Charge Management](#5-service-charge-management)
6. [Service Providers Management](#6-service-providers-management)
7. [Subscription Management (Super Admin Only)](#7-subscription-management-super-admin-only)
8. [React.js Integration Examples](#8-reactjs-integration-examples)

---

## 1. Authentication & Setup

### Base URL
```
https://your-api-domain.com/api
```

### Headers Required
All authenticated requests require:
```javascript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

### Login (Get Admin Token)
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_here",
  "user": {
    "user_id": "user-uuid",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "status": "active",
    "profile": {
      "estate_id": "estate-uuid",
      "role": "Admin" // or "Super Admin"
    }
  }
}
```

**React.js Example:**
```javascript
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
};
```

---

## 2. Estate Management (Super Admin Only)

### 2.1 Create Estate
**Endpoint:** `POST /estates`

**Access:** Super Admin only

**Request Body:**
```json
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

**React.js Example:**
```javascript
const createEstate = async (estateData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/estates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(estateData)
  });
  return await response.json();
};
```

### 2.2 Get All Estates
**Endpoint:** `GET /estates?page=1&limit=20`

**Access:** All authenticated users (but only Super Admin can create/update/delete)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "estate_id": "estate-uuid-1",
      "name": "Paradise Estate",
      "email": "admin@paradiseestate.com",
      "address": "123 Paradise Street, Lagos, Nigeria",
      "created_at": "2024-01-15T10:00:00.000Z"
    },
    {
      "estate_id": "estate-uuid-2",
      "name": "Range View Estate",
      "email": "admin@rangeviewestate.com",
      "address": "456 Range View Boulevard, Lagos, Nigeria",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 2.3 Get Estate by ID
**Endpoint:** `GET /estates/{estateId}`

**Response:**
```json
{
  "estate_id": "estate-uuid",
  "name": "Paradise Estate",
  "email": "admin@paradiseestate.com",
  "address": "123 Paradise Street, Lagos, Nigeria",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

### 2.4 Update Estate
**Endpoint:** `PUT /estates/{estateId}`

**Access:** Super Admin, Estate Admin (only their estate)

**Request Body:**
```json
{
  "name": "Paradise Estate Updated",
  "email": "newemail@paradiseestate.com",
  "address": "Updated Address"
}
```

**Response:**
```json
{
  "estate_id": "estate-uuid",
  "name": "Paradise Estate Updated",
  "email": "newemail@paradiseestate.com",
  "address": "Updated Address",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

### 2.5 Delete Estate
**Endpoint:** `DELETE /estates/{estateId}`

**Access:** Super Admin, Estate Admin (only their estate)

**Response:**
```json
{
  "message": "Estate deleted successfully"
}
```

### 2.6 Search Estates
**Endpoint:** `GET /estates/search?query=paradise`

**Query Parameters:**
- `query` (required): Search term

**Response:**
```json
{
  "data": [
    {
      "estate_id": "estate-uuid",
      "name": "Paradise Estate",
      "email": "admin@paradiseestate.com",
      "address": "123 Paradise Street, Lagos, Nigeria"
    }
  ]
}
```

---

## 3. User Management

### 3.1 Get Users by Estate
**Endpoint:** `GET /users/estate/{estateId}?page=1&limit=20`

**Access:** Estate Admin, Security Personnel, Super Admin

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "user_id": "user-uuid",
      "email": "resident@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "status": "active",
      "profile": {
        "estate_id": "estate-uuid",
        "role": "Residence",
        "apartment_type": "2-Bedroom",
        "house_address": "Block A, Flat 101",
        "phone_number": "+2348012345678"
      },
      "service_charge": {
        "bsc_id": "bsc-uuid",
        "service_charge": 50000,
        "paid_charge": 30000,
        "outstanding_charge": 20000,
        "is_validated": false
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Note:** Service charges are automatically included in the response.

### 3.2 Get User by ID
**Endpoint:** `GET /users/{userId}`

**Access:** All authenticated users

**Response:**
```json
{
  "user_id": "user-uuid",
  "email": "resident@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "status": "active",
  "profile": {
    "user_id": "user-uuid",
    "estate_id": "estate-uuid",
    "role": "Residence",
    "apartment_type": "2-Bedroom",
    "house_address": "Block A, Flat 101",
    "phone_number": "+2348012345678"
  },
  "service_charge": {
    "bsc_id": "bsc-uuid",
    "service_charge": 50000,
    "paid_charge": 30000,
    "outstanding_charge": 20000,
    "files": [
      {
        "bsc_file_id": "file-uuid",
        "file_url": "https://storage.example.com/receipt.pdf",
        "uploaded_at": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

### 3.3 Search Users
**Endpoint:** `GET /users/search?query=john&estate_id={estateId}`

**Query Parameters:**
- `query` (required): Search term
- `estate_id` (optional): Filter by estate

**Response:**
```json
{
  "data": [
    {
      "user_id": "user-uuid",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "profile": {
        "estate_id": "estate-uuid",
        "role": "Residence"
      },
      "service_charge": {
        "bsc_id": "bsc-uuid",
        "service_charge": 50000,
        "paid_charge": 30000,
        "outstanding_charge": 20000
      }
    }
  ]
}
```

### 3.4 Activate User
**Endpoint:** `PUT /users/{userId}/activate`

**Access:** Estate Admin, Super Admin

**Request Body:** None (empty body)

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

**React.js Example:**
```javascript
const activateUser = async (userId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/users/${userId}/activate`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

### 3.5 Suspend User
**Endpoint:** `PUT /users/{userId}/suspend`

**Access:** Estate Admin, Super Admin

**Request Body:** None (empty body)

**Response:**
```json
{
  "user_id": "user-uuid",
  "status": "suspended",
  "email": "resident@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

### 3.6 Update User Status
**Endpoint:** `PUT /users/{userId}/status`

**Access:** Estate Admin, Super Admin

**Request Body:**
```json
{
  "status": "active" // or "pending" or "suspended"
}
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

### 3.7 Assign Estate to User
**Endpoint:** `PUT /users/{userId}/assign-estate`

**Access:** Estate Admin, Super Admin

**Request Body:**
```json
{
  "estate_id": "estate-uuid",
  "role": "Residence", // or "Security Personnel"
  "apartment_type": "2-Bedroom", // optional
  "house_address": "Block A, Flat 101", // optional
  "phone_number": "+2348012345678" // optional
}
```

**Apartment Types:**
- `Studio`
- `1-Bedroom`
- `2-Bedroom`
- `3-Bedroom`
- `4-Bedroom`
- `5-Bedroom`
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

### 3.8 Make User Estate Admin
**Endpoint:** `PUT /users/{userId}/make-admin`

**Access:** Super Admin only

**Request Body:**
```json
{
  "estate_id": "estate-uuid"
}
```

**Response:**
```json
{
  "user_id": "user-uuid",
  "role": "Admin",
  "estate_id": "estate-uuid",
  "message": "User promoted to Estate Admin"
}
```

**Important:** User must be ACTIVE before promoting to admin.

### 3.9 Make User Super Admin
**Endpoint:** `PUT /users/{userId}/make-super-admin`

**Access:** Super Admin only

**Request Body:**
```json
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

**Important:** 
- Only existing Super Admins can create new Super Admins
- User must be ACTIVE before promoting
- `confirm` must be `true`

---

## 4. Announcements (Estate Admin Only)

### 4.1 Create Announcement (All Residents)
**Endpoint:** `POST /announcements`

**Access:** Estate Admin only

**Request Body:**
```json
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

**Announcement Types:**
- `general`
- `payment_reminder`
- `maintenance`
- `event`
- `security`
- `urgent`

**Recipient Types:**
- `all_residents` - All residents in estate
- `security_personnel` - Only security personnel
- `single_user` - Single user (requires `target_user_ids`)
- `specific_residents` - Multiple users (requires `target_user_ids`)

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

**Note:** `image_urls` is optional. Omit it if no images are needed.

### 4.2 Create Announcement (Single User)
**Endpoint:** `POST /announcements`

**Request Body:**
```json
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

### 4.3 Create Announcement (Specific Residents)
**Endpoint:** `POST /announcements`

**Request Body:**
```json
{
  "title": "Block A Meeting",
  "message": "Meeting for Block A residents scheduled for Friday.",
  "announcement_type": "event",
  "recipient_type": "specific_residents",
  "target_user_ids": ["user-uuid-1", "user-uuid-2", "user-uuid-3"]
}
```

**Note:** All target users must belong to the admin's estate. System validates this automatically.

### 4.4 Send Payment Reminder (Quick Method)
**Endpoint:** `POST /announcements/payment-reminder`

**Access:** Estate Admin only

**Request Body:**
```json
{
  "target_user_id": "user-uuid",
  "amount": 50000,
  "due_date": "2024-01-30",
  "description": "Monthly service charge payment",
  "utility_account_id": "account-uuid" // optional
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

### 4.5 Get Sent Announcements
**Endpoint:** `GET /announcements/sent?page=1&limit=20`

**Access:** Estate Admin only

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "announcement_id": "announcement-uuid",
      "title": "Estate Meeting Scheduled",
      "message": "There will be an estate meeting...",
      "announcement_type": "event",
      "recipient_type": "all_residents",
      "image_urls": ["https://storage.example.com/image.jpg"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 10,
  "totalPages": 1
}
```

### 4.6 Get Announcement by ID
**Endpoint:** `GET /announcements/{announcementId}`

**Response:**
```json
{
  "announcement_id": "announcement-uuid",
  "title": "Estate Meeting Scheduled",
  "message": "There will be an estate meeting...",
  "announcement_type": "event",
  "recipient_type": "all_residents",
  "image_urls": ["https://storage.example.com/image.jpg"],
  "sender": {
    "first_name": "Admin",
    "last_name": "User"
  },
  "created_at": "2024-01-15T10:00:00Z"
}
```

### 4.7 Update Announcement
**Endpoint:** `PUT /announcements/{announcementId}`

**Access:** Estate Admin only (only the creator can update)

**Request Body:**
```json
{
  "title": "Updated Title",
  "message": "Updated: Meeting postponed to next Saturday",
  "image_urls": [
    "https://storage.example.com/announcements/updated-image.jpg"
  ]
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response:**
```json
{
  "announcement_id": "announcement-uuid",
  "title": "Updated Title",
  "message": "Updated: Meeting postponed to next Saturday",
  "image_urls": [
    "https://storage.example.com/announcements/updated-image.jpg"
  ],
  "updated_at": "2024-01-16T10:00:00Z"
}
```

### 4.8 Delete Announcement
**Endpoint:** `DELETE /announcements/{announcementId}`

**Access:** Estate Admin only (only the creator can delete)

**Response:**
```json
{
  "message": "Announcement deleted successfully"
}
```

---

## 5. Service Charge Management

### 5.1 Get All Service Charges (Estate)
**Endpoint:** `GET /bank-service-charges/estate/{estateId}?page=1&limit=20`

**Access:** Estate Admin, Security Personnel, Super Admin

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

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
      "payment_frequency": "monthly",
      "bank_name": "Access Bank",
      "account_name": "Paradise Estate",
      "account_number": "1234567890",
      "is_validated": false,
      "user": {
        "user_id": "user-uuid",
        "email": "resident@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "files": [
        {
          "bsc_file_id": "file-uuid",
          "file_url": "https://storage.example.com/receipt.pdf",
          "uploaded_at": "2024-01-15T11:00:00Z"
        }
      ]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### 5.2 Get All Service Charges (System-Wide)
**Endpoint:** `GET /bank-service-charges?page=1&limit=20`

**Access:** Estate Admin, Super Admin

**Response:** Same format as above

### 5.3 Update Service Charge (Admin)
**Endpoint:** `PUT /bank-service-charges/{bscId}`

**Access:** Estate Admin, Super Admin

**Request Body:**
```json
{
  "service_charge": 50000,
  "paid_charge": 30000,
  "is_validated": true,
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Note:** 
- `outstanding_charge` is automatically calculated as `service_charge - paid_charge`
- If result is negative, it's set to 0
- All fields are optional - only include what you want to update

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "user_id": "user-uuid",
  "service_charge": 50000,
  "paid_charge": 30000,
  "outstanding_charge": 20000,
  "is_validated": true,
  "validated_at": "2024-01-15T12:00:00Z",
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15",
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Paradise Estate",
  "account_number": "1234567890"
}
```

### 5.4 Validate Service Charge Payment
**Endpoint:** `PUT /bank-service-charges/{bscId}/validate`

**Access:** Estate Admin, Super Admin

**Request Body:**
```json
{
  "is_validated": true,
  "notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Response:**
```json
{
  "bsc_id": "bsc-uuid",
  "is_validated": true,
  "validated_at": "2024-01-15T12:00:00Z",
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**Note:** This is separate from updating payment amounts. Use this to mark a payment as validated after reviewing receipts.

---

## 6. Service Providers Management

### 6.1 Create Service Provider
**Endpoint:** `POST /service-directory/providers`

**Access:** Estate Admin only

**Request Body:**
```json
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
- `photos` is optional (max 5 photos)
- `profile_picture_url` is the provider's profile picture
- `photos` are work showcase images (different from profile picture)

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
    }
  ]
}
```

### 6.2 Get All Services
**Endpoint:** `GET /service-directory/services`

**Access:** All authenticated users

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

### 6.3 Update Service Provider
**Endpoint:** `PUT /service-directory/providers/{providerId}`

**Access:** Estate Admin only

**Request Body:**
```json
{
  "phone": "+2348098765432",
  "availability": "Mon-Sat, 8 AM - 7 PM",
  "bio": "Updated bio text"
}
```

**Note:** All fields are optional - only include what you want to update.

**Response:**
```json
{
  "provider_id": "provider-uuid",
  "phone": "+2348098765432",
  "availability": "Mon-Sat, 8 AM - 7 PM",
  "bio": "Updated bio text",
  "updated_at": "2024-01-16T10:00:00Z"
}
```

### 6.4 Delete Service Provider
**Endpoint:** `DELETE /service-directory/providers/{providerId}`

**Access:** Estate Admin only

**Response:**
```json
{
  "message": "Service provider deleted successfully"
}
```

### 6.5 Add Provider Photo
**Endpoint:** `POST /service-directory/providers/{providerId}/photos`

**Access:** Estate Admin only

**Request Body:**
```json
{
  "image_url": "https://storage.example.com/new-photo.jpg"
}
```

**Response:**
```json
{
  "provider_photo_id": "photo-uuid",
  "provider_id": "provider-uuid",
  "image_url": "https://storage.example.com/new-photo.jpg",
  "uploaded_at": "2024-01-16T10:00:00Z"
}
```

**Note:** Maximum 5 photos per provider. If limit reached, delete one first.

### 6.6 Delete Provider Photo
**Endpoint:** `DELETE /service-directory/providers/{providerId}/photos/{photoId}`

**Access:** Estate Admin only

**Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

---

## 7. Subscription Management (Super Admin Only)

### 7.1 Grant Free Subscription
**Endpoint:** `POST /subscriptions/admin/grant-free`

**Access:** Super Admin only

**Request Body:**
```json
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

**Important:**
- User must NOT have an active subscription (cancel existing one first if needed)
- `duration_days` can be any positive number (e.g., 7, 30, 90, 365)
- Subscription is immediately active
- `isSubscribe` in user profile is automatically set to `true`

### 7.2 Manually Check Expired Subscriptions
**Endpoint:** `POST /subscriptions/admin/check-expired`

**Access:** Super Admin, Estate Admin

**Request Body:** None (empty body)

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
- Cron job runs automatically every hour
- This endpoint allows manual trigger
- Updates `expired_date` and sets `isSubscribe` to `false` for expired subscriptions

---

## 8. React.js Integration Examples

### 8.1 API Service Setup

Create an API service file (`apiService.js`):

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-domain.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  // Generic fetch wrapper
  async fetch(endpoint, options = {}) {
    const token = this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }

    return await response.json();
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.fetch(url);
  }

  // POST request
  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.fetch(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
```

### 8.2 Authentication Hook

Create a custom hook (`useAuth.js`):

```javascript
import { useState, useEffect } from 'react';
import apiService from './apiService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token and get user info
      apiService.get('/users/me')
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${apiService.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.profile?.role === 'Admin' || user?.profile?.role === 'Super Admin';
  };

  const isSuperAdmin = () => {
    return user?.profile?.role === 'Super Admin';
  };

  return { user, loading, login, logout, isAdmin, isSuperAdmin };
};
```

### 8.3 Estate Management Component Example

```javascript
import React, { useState, useEffect } from 'react';
import apiService from './apiService';
import { useAuth } from './useAuth';

const EstatesManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (isSuperAdmin()) {
      loadEstates();
    }
  }, [isSuperAdmin]);

  const loadEstates = async () => {
    try {
      const data = await apiService.get('/estates', { page: 1, limit: 20 });
      setEstates(data.data);
    } catch (error) {
      console.error('Error loading estates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEstate = async (e) => {
    e.preventDefault();
    try {
      const newEstate = await apiService.post('/estates', formData);
      setEstates([...estates, newEstate]);
      setFormData({ name: '', email: '', address: '' });
      alert('Estate created successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteEstate = async (estateId) => {
    if (!window.confirm('Are you sure you want to delete this estate?')) return;
    
    try {
      await apiService.delete(`/estates/${estateId}`);
      setEstates(estates.filter(e => e.estate_id !== estateId));
      alert('Estate deleted successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!isSuperAdmin()) {
    return <div>Access denied. Super Admin only.</div>;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Estates Management</h2>
      
      <form onSubmit={handleCreateEstate}>
        <input
          type="text"
          placeholder="Estate Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
        <button type="submit">Create Estate</button>
      </form>

      <div>
        <h3>All Estates</h3>
        {estates.map(estate => (
          <div key={estate.estate_id}>
            <h4>{estate.name}</h4>
            <p>{estate.email}</p>
            <p>{estate.address}</p>
            <button onClick={() => handleDeleteEstate(estate.estate_id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstatesManagement;
```

### 8.4 User Management Component Example

```javascript
import React, { useState, useEffect } from 'react';
import apiService from './apiService';
import { useAuth } from './useAuth';

const UsersManagement = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstate, setSelectedEstate] = useState(user?.profile?.estate_id);

  useEffect(() => {
    if (isAdmin() && selectedEstate) {
      loadUsers();
    }
  }, [isAdmin, selectedEstate]);

  const loadUsers = async () => {
    try {
      const data = await apiService.get(`/users/estate/${selectedEstate}`, {
        page: 1,
        limit: 50,
      });
      setUsers(data.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await apiService.put(`/users/${userId}/activate`);
      loadUsers(); // Reload list
      alert('User activated successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      await apiService.put(`/users/${userId}/suspend`);
      loadUsers(); // Reload list
      alert('User suspended successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!isAdmin()) {
    return <div>Access denied. Admin only.</div>;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Users Management</h2>
      
      <div>
        <h3>Estate Residents</h3>
        {users.map(user => (
          <div key={user.user_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
            <h4>{user.first_name} {user.last_name}</h4>
            <p>Email: {user.email}</p>
            <p>Status: {user.status}</p>
            <p>Role: {user.profile?.role}</p>
            {user.service_charge && (
              <div>
                <p>Service Charge: ₦{user.service_charge.service_charge}</p>
                <p>Paid: ₦{user.service_charge.paid_charge}</p>
                <p>Outstanding: ₦{user.service_charge.outstanding_charge}</p>
              </div>
            )}
            <div>
              {user.status === 'pending' && (
                <button onClick={() => handleActivateUser(user.user_id)}>
                  Activate User
                </button>
              )}
              {user.status === 'active' && (
                <button onClick={() => handleSuspendUser(user.user_id)}>
                  Suspend User
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;
```

### 8.5 Announcements Component Example

```javascript
import React, { useState, useEffect } from 'react';
import apiService from './apiService';
import { useAuth } from './useAuth';

const AnnouncementsManagement = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    announcement_type: 'general',
    recipient_type: 'all_residents',
    target_user_ids: [],
    image_urls: [],
  });

  useEffect(() => {
    if (isAdmin()) {
      loadAnnouncements();
    }
  }, [isAdmin]);

  const loadAnnouncements = async () => {
    try {
      const data = await apiService.get('/announcements/sent', {
        page: 1,
        limit: 20,
      });
      setAnnouncements(data.data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      // Remove empty arrays
      if (payload.target_user_ids.length === 0) delete payload.target_user_ids;
      if (payload.image_urls.length === 0) delete payload.image_urls;
      
      await apiService.post('/announcements', payload);
      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        announcement_type: 'general',
        recipient_type: 'all_residents',
        target_user_ids: [],
        image_urls: [],
      });
      loadAnnouncements();
      alert('Announcement created successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await apiService.delete(`/announcements/${announcementId}`);
      loadAnnouncements();
      alert('Announcement deleted successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!isAdmin()) {
    return <div>Access denied. Admin only.</div>;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Announcements Management</h2>
      
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Create New Announcement'}
      </button>

      {showForm && (
        <form onSubmit={handleCreateAnnouncement}>
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
          <select
            value={formData.announcement_type}
            onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value })}
          >
            <option value="general">General</option>
            <option value="payment_reminder">Payment Reminder</option>
            <option value="maintenance">Maintenance</option>
            <option value="event">Event</option>
            <option value="security">Security</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={formData.recipient_type}
            onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
          >
            <option value="all_residents">All Residents</option>
            <option value="security_personnel">Security Personnel</option>
            <option value="single_user">Single User</option>
            <option value="specific_residents">Specific Residents</option>
          </select>
          <button type="submit">Create Announcement</button>
        </form>
      )}

      <div>
        <h3>Sent Announcements</h3>
        {announcements.map(announcement => (
          <div key={announcement.announcement_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
            <h4>{announcement.title}</h4>
            <p>{announcement.message}</p>
            <p>Type: {announcement.announcement_type}</p>
            <p>Recipient: {announcement.recipient_type}</p>
            {announcement.image_urls && announcement.image_urls.length > 0 && (
              <div>
                <p>Images: {announcement.image_urls.length}</p>
              </div>
            )}
            <button onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsManagement;
```

### 8.6 Service Charge Management Component Example

```javascript
import React, { useState, useEffect } from 'react';
import apiService from './apiService';
import { useAuth } from './useAuth';

const ServiceChargeManagement = () => {
  const { user, isAdmin } = useAuth();
  const [serviceCharges, setServiceCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCharge, setEditingCharge] = useState(null);
  const [formData, setFormData] = useState({
    service_charge: 0,
    paid_charge: 0,
    is_validated: false,
    validation_notes: '',
  });

  useEffect(() => {
    if (isAdmin() && user?.profile?.estate_id) {
      loadServiceCharges();
    }
  }, [isAdmin, user]);

  const loadServiceCharges = async () => {
    try {
      const data = await apiService.get(`/bank-service-charges/estate/${user.profile.estate_id}`, {
        page: 1,
        limit: 50,
      });
      setServiceCharges(data.data);
    } catch (error) {
      console.error('Error loading service charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCharge = async (bscId) => {
    try {
      const payload = {
        service_charge: formData.service_charge,
        paid_charge: formData.paid_charge,
        is_validated: formData.is_validated,
        validation_notes: formData.validation_notes,
      };
      
      await apiService.put(`/bank-service-charges/${bscId}`, payload);
      setEditingCharge(null);
      loadServiceCharges();
      alert('Service charge updated successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleValidateCharge = async (bscId, isValidated, notes) => {
    try {
      await apiService.put(`/bank-service-charges/${bscId}/validate`, {
        is_validated: isValidated,
        notes: notes,
      });
      loadServiceCharges();
      alert('Service charge validated successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!isAdmin()) {
    return <div>Access denied. Admin only.</div>;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Service Charge Management</h2>
      
      <div>
        {serviceCharges.map(charge => (
          <div key={charge.bsc_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
            <h4>{charge.user.first_name} {charge.user.last_name}</h4>
            <p>Email: {charge.user.email}</p>
            <p>Service Charge: ₦{charge.service_charge}</p>
            <p>Paid: ₦{charge.paid_charge}</p>
            <p>Outstanding: ₦{charge.outstanding_charge}</p>
            <p>Validated: {charge.is_validated ? 'Yes' : 'No'}</p>
            
            {charge.files && charge.files.length > 0 && (
              <div>
                <p>Payment Receipts:</p>
                {charge.files.map(file => (
                  <a key={file.bsc_file_id} href={file.file_url} target="_blank" rel="noopener noreferrer">
                    View Receipt
                  </a>
                ))}
              </div>
            )}

            {editingCharge === charge.bsc_id ? (
              <div>
                <input
                  type="number"
                  placeholder="Service Charge"
                  value={formData.service_charge}
                  onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Paid Charge"
                  value={formData.paid_charge}
                  onChange={(e) => setFormData({ ...formData, paid_charge: parseFloat(e.target.value) })}
                />
                <textarea
                  placeholder="Validation Notes"
                  value={formData.validation_notes}
                  onChange={(e) => setFormData({ ...formData, validation_notes: e.target.value })}
                />
                <button onClick={() => handleUpdateCharge(charge.bsc_id)}>Save</button>
                <button onClick={() => setEditingCharge(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                <button onClick={() => {
                  setEditingCharge(charge.bsc_id);
                  setFormData({
                    service_charge: charge.service_charge,
                    paid_charge: charge.paid_charge,
                    is_validated: charge.is_validated,
                    validation_notes: charge.validation_notes || '',
                  });
                }}>
                  Update Payment
                </button>
                <button onClick={() => handleValidateCharge(charge.bsc_id, true, 'Payment verified')}>
                  Validate Payment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceChargeManagement;
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solution:** Token expired or invalid. Redirect to login.

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
**Solution:** User doesn't have required role. Show access denied message.

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```
**Solution:** Resource doesn't exist. Show appropriate message.

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "errors": ["Field is required"]
}
```
**Solution:** Show validation errors to user.

---

## Role-Based Access Summary

### Super Admin
- ✅ Create/Update/Delete estates
- ✅ Make users Estate Admin
- ✅ Make users Super Admin
- ✅ Manage all users across all estates
- ✅ Grant free subscriptions
- ✅ Access all data (no estate restrictions)

### Estate Admin
- ✅ View/Update their estate (read-only for other estates)
- ✅ Manage users in their estate
- ✅ Activate/Suspend estate users
- ✅ Create/Update/Delete announcements
- ✅ View/Update service charges in their estate
- ✅ Validate service charge payments
- ✅ Create/Update/Delete service providers
- ❌ Cannot create other admins
- ❌ Cannot access other estates

---

## Important Notes

1. **Authentication:** Always include `Authorization: Bearer {token}` header
2. **Estate Scoping:** Estate Admins can only access their estate's data
3. **Service Charges:** Automatically included when fetching users by estate
4. **Image Uploads:** Upload images to storage first, then provide URLs in API requests
5. **Pagination:** Most list endpoints support `page` and `limit` query parameters
6. **Error Handling:** Always handle API errors gracefully in your React components
7. **Token Management:** Store tokens securely and refresh when expired

---

**Last Updated:** January 2024  
**Version:** 1.0

