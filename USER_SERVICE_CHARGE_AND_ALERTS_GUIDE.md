# User Service Charge & Alerts Guide

This guide explains how users upload service charge receipts/payments and create alerts for their estate.

---

## Table of Contents

1. [Service Charge Receipt Upload](#1-service-charge-receipt-upload)
2. [Service Charge Payment](#2-service-charge-payment)
3. [Creating Alerts for Estate](#3-creating-alerts-for-estate)

---

## 1. Service Charge Receipt Upload

### Overview
Users can upload payment receipts/proof after making service charge payments. This allows estate admins to verify and update payment records.

### Prerequisites
- User must have a service charge record created
- User must be authenticated

### Step-by-Step Process

#### Step 1: Create Service Charge Record (If Not Exists)

First, create your service charge record with bank details:

```bash
POST /bank-service-charges
Authorization: Bearer {user_token}
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

**Note:** Each user can only have ONE service charge record.

#### Step 2: Upload Payment Receipt

After making a payment (via bank transfer, cash, etc.), upload the receipt/proof:

```bash
POST /bank-service-charges/me/files
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "file_url": "https://storage.example.com/bank-receipt.pdf"
}
```

**Request Body:**
- `file_url` (required): URL of the uploaded receipt/image file
  - Can be a PDF, image (JPG, PNG), or any file URL
  - File should be uploaded to your storage service (AWS S3, Cloudinary, etc.) first
  - Then provide the public URL here

**Response:**
```json
{
  "bsc_file_id": "file-uuid",
  "bsc_id": "bsc-uuid",
  "file_url": "https://storage.example.com/bank-receipt.pdf",
  "uploaded_at": "2024-01-15T13:00:00.000Z"
}
```

**What Happens:**
1. ✅ Receipt file is linked to your service charge record
2. ✅ Estate admin can view the receipt
3. ✅ Admin reviews and validates the payment
4. ✅ Admin updates `paid_charge` amount after verification

**Use Cases:**
- Bank transfer receipt
- Bank statement screenshot
- Payment confirmation slip
- Cash payment receipt
- Any proof of payment

#### Step 3: View Your Uploaded Files

```bash
GET /bank-service-charges/me/files
Authorization: Bearer {user_token}
```

**Response:**
```json
[
  {
    "bsc_file_id": "file-uuid-1",
    "file_url": "https://storage.example.com/receipt-jan.pdf",
    "uploaded_at": "2024-01-15T11:00:00Z"
  },
  {
    "bsc_file_id": "file-uuid-2",
    "file_url": "https://storage.example.com/receipt-feb.pdf",
    "uploaded_at": "2024-02-15T11:00:00Z"
  }
]
```

#### Step 4: Delete a File (If Needed)

```bash
DELETE /bank-service-charges/me/files/{fileId}
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

### Important Notes

- **Users can only upload receipts** - they cannot update payment amounts
- **Payment amounts are updated by admins only** after reviewing receipts
- **Upload receipt first**, then admin reviews and updates `paid_charge`
- **Multiple receipts can be uploaded** for different payments
- **Each user has only ONE service charge record** but can have multiple receipt files

### Complete Flow Example

1. **User creates service charge record** → `POST /bank-service-charges`
2. **User makes payment** (bank transfer, cash, etc.)
3. **User uploads receipt** → `POST /bank-service-charges/me/files`
4. **Admin reviews receipt** → `GET /bank-service-charges/estate/{estateId}`
5. **Admin validates and updates payment** → `PUT /bank-service-charges/{bscId}`
6. **User checks updated balance** → `GET /bank-service-charges/me`

---

## 2. Service Charge Payment

### Overview
Users can make service charge payments through the system. There are two payment methods available.

### Payment Methods

#### Option A: Pay via Wallet (Internal Payment)

```bash
POST /bank-service-charges/me/pay
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "payment_method": "wallet",
  "amount": 30000
}
```

**What Happens:**
1. ✅ Payment is deducted from user's wallet balance
2. ✅ Payment record is created with `SUCCESS` status
3. ✅ `paid_charge` increases by payment amount
4. ✅ `outstanding_charge` decreases by payment amount
5. ✅ Payment is automatically processed

**Response:**
```json
{
  "payment": {
    "payment_id": "payment-uuid",
    "amount": 30000,
    "status": "success",
    "reference": "BSC_abc123",
    "paid_at": "2024-01-15T12:00:00.000Z"
  },
  "bank_service_charge": {
    "service_charge": 50000,
    "paid_charge": 30000,
    "outstanding_charge": 20000
  },
  "payment_url": null
}
```

#### Option B: Pay via External Payment (Card/Bank Transfer)

```bash
POST /bank-service-charges/me/pay
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "payment_method": "external",
  "amount": 20000
}
```

**What Happens:**
1. ✅ Payment record is created with `PENDING` status
2. ✅ Payment URL is generated (for Paystack/card payment)
3. ✅ User is redirected to payment page
4. ⏳ Payment must be verified via webhook or manual verification
5. ⏳ Once verified, `paid_charge` and `outstanding_charge` are updated

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

**Note:** After external payment, you may still need to upload receipt for admin verification.

---

## 3. Creating Alerts for Estate

### Overview
Users can create alerts to notify other residents in their estate about important information, emergencies, maintenance work, etc.

### Who Can Create Alerts?
- **All Authenticated Users** (Residents, Estate Admins, Security Personnel)
- Alerts are automatically scoped to the sender's estate

### Step-by-Step Process

#### Step 1: Create Alert

```bash
POST /alerts
Authorization: Bearer {user_token}
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

**Request Body:**
- `message` (required): Alert message/content
- `alert_type` (required): Type of alert (see types below)
- `urgency_level` (required): Urgency level (see levels below)
- `recipients` (required): Who should receive the alert
  - For estate-wide alerts: `{"type": "estate"}` (estate_id is automatically set to sender's estate)
  - For specific users: `{"type": "user", "user_ids": ["user-uuid-1", "user-uuid-2"]}`

**Alert Types:**
- `general` - General alerts/information
- `emergency` - Emergency situations
- `maintenance` - Maintenance work notices
- `security` - Security alerts
- `utility` - Utility interruptions or issues

**Urgency Levels:**
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `critical` - Critical/urgent

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "sender_user_id": "user-uuid",
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

**Important Notes:**
- ✅ When `recipients.type` is `"estate"`, the system **automatically uses sender's estate_id**
- ✅ Residents **cannot send alerts to other estates** (blocked by system)
- ✅ Only users in the same estate receive the alert
- ✅ Push notifications are sent to all active users in the estate

### Recipient Options

#### Option 1: Send to All Estate Residents (Recommended)

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

**Note:** Estate ID is automatically set to sender's estate. No need to specify `estate_id`.

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

### What Happens When Alert is Created

1. ✅ Alert is saved in database
2. ✅ System automatically uses sender's estate_id for estate-scoped alerts
3. ✅ Only users in the same estate receive the alert
4. ✅ Push notifications are sent to all active users in the estate
5. ✅ Users receive alerts in their app

### Viewing Alerts

#### Get Your Alerts

```bash
GET /alerts/me?page=1&limit=20
Authorization: Bearer {user_token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "alert_id": "alert-uuid",
      "sender_user_id": "user-uuid",
      "message": "Road block on Main Street...",
      "alert_type": "maintenance",
      "urgency_level": "high",
      "recipients": {
        "type": "estate",
        "estate_id": "estate-uuid"
      },
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### Get Specific Alert

```bash
GET /alerts/{alertId}
Authorization: Bearer {user_token}
```

### Updating/Deleting Alerts

#### Update Alert (Only Sender Can Update)

```bash
PUT /alerts/{alertId}
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "message": "Updated message",
  "urgency_level": "critical"
}
```

#### Delete Alert

```bash
DELETE /alerts/{alertId}
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "reason": "No longer needed"
}
```

### Estate Scope Security

- ✅ **Automatic Estate Scoping**: When `recipients.type` is `"estate"`, system automatically uses sender's `estate_id`
- ✅ **Cross-Estate Prevention**: Residents cannot send alerts to other estates (blocked by system)
- ✅ **Estate Isolation**: Only users with matching `estate_id` in their profile receive alerts
- ✅ **Automatic Filtering**: Alerts are automatically scoped to the sender's estate

### Example Use Cases

1. **Maintenance Notice**
   ```json
   {
     "message": "Elevator maintenance scheduled for tomorrow 8 AM - 12 PM",
     "alert_type": "maintenance",
     "urgency_level": "medium",
     "recipients": {"type": "estate"}
   }
   ```

2. **Emergency Alert**
   ```json
   {
     "message": "Fire alarm test in 10 minutes. Please evacuate building.",
     "alert_type": "emergency",
     "urgency_level": "critical",
     "recipients": {"type": "estate"}
   }
   ```

3. **Utility Interruption**
   ```json
   {
     "message": "Water supply will be interrupted tomorrow 9 AM - 3 PM",
     "alert_type": "utility",
     "urgency_level": "high",
     "recipients": {"type": "estate"}
   }
   ```

4. **Security Alert**
   ```json
   {
     "message": "Suspicious activity reported near Gate 2. Please be cautious.",
     "alert_type": "security",
     "urgency_level": "high",
     "recipients": {"type": "estate"}
   }
   ```

---

## Summary

### Service Charge Receipt Upload
- **Endpoint**: `POST /bank-service-charges/me/files`
- **Purpose**: Upload payment receipts for admin verification
- **Process**: User uploads receipt → Admin reviews → Admin updates payment amount
- **Note**: Users cannot update payment amounts, only admins can

### Service Charge Payment
- **Endpoint**: `POST /bank-service-charges/me/pay`
- **Methods**: Wallet payment (instant) or External payment (Paystack/card)
- **Result**: Payment is recorded and balances are updated

### Creating Alerts
- **Endpoint**: `POST /alerts`
- **Purpose**: Notify estate residents about important information
- **Scope**: Automatically scoped to sender's estate
- **Features**: Multiple alert types, urgency levels, push notifications

---

## Quick Reference

### Service Charge Endpoints
- `POST /bank-service-charges` - Create service charge record
- `GET /bank-service-charges/me` - Get my service charge
- `PUT /bank-service-charges/me` - Update bank details (users only)
- `POST /bank-service-charges/me/files` - Upload receipt
- `GET /bank-service-charges/me/files` - Get my receipts
- `DELETE /bank-service-charges/me/files/{fileId}` - Delete receipt
- `POST /bank-service-charges/me/pay` - Make payment

### Alert Endpoints
- `POST /alerts` - Create alert
- `GET /alerts/me` - Get my alerts
- `GET /alerts/{alertId}` - Get specific alert
- `PUT /alerts/{alertId}` - Update alert (sender only)
- `DELETE /alerts/{alertId}` - Delete alert

---

For more details, see:
- `SERVICE_CHARGE_GUIDE.md` - Complete service charge documentation
- `RESIDENT_SECURITY_FRONTEND_GUIDE.md` - Frontend implementation guide
- `COMPLETE_USER_GUIDE.md` - Complete user operations guide

