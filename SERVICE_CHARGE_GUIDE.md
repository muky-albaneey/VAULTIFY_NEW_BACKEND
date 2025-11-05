# Service Charge System Guide

## Overview

The Service Charge system allows residents to manage and pay their estate service charges. It tracks the total charge, payments made, outstanding balances, and supports payment validation by estate admins.

---

## How Service Charges Work

### 1. **Service Charge Record Structure**

Each user has **one service charge record** that tracks:

- **Total Service Charge** (`service_charge`) - The full amount owed
- **Paid Amount** (`paid_charge`) - How much has been paid
- **Outstanding Balance** (`outstanding_charge`) - Remaining amount to pay
- **Payment Frequency** - Monthly, Quarterly, or Yearly
- **Bank Details** - Where payments should be made
- **Validation Status** - Whether admin has validated the payment

**Formula:**
```
outstanding_charge = service_charge - paid_charge
```

### 2. **Workflow Overview**

```
┌─────────────────┐
│ User Creates    │ → Sets up service charge record
│ Service Charge  │   with total amount & bank details
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Makes      │ → Pays via wallet or external payment
│ Payment         │   (full or partial)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Uploads    │ → Uploads payment receipt/proof
│ Receipt/Proof   │   (bank statement, receipt)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Validates │ → Admin reviews and validates payment
│ Payment         │   Marks as validated
└─────────────────┘
```

---

## User Workflow

### Step 1: Create Service Charge Record

**Only done once per user.** User sets up their service charge record:

```bash
POST /bank-service-charges
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "service_charge": 50000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Greenview Estate",
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
  "account_name": "Greenview Estate",
  "account_number": "1234567890",
  "is_validated": false,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

**Rules:**
- ✅ Each user can only have ONE service charge record
- ✅ Service charge must be greater than 0
- ✅ Cannot create if record already exists

### Step 2: View Service Charge

```bash
GET /bank-service-charges/me
Authorization: Bearer {user_token}
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
  "account_name": "Greenview Estate",
  "account_number": "1234567890",
  "is_validated": false,
  "files": [
    {
      "bsc_file_id": "file-uuid",
      "file_url": "https://storage.example.com/receipt.pdf",
      "uploaded_at": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Step 3: Make Payment

Users can pay via **wallet** or **external payment** (bank transfer, card, etc.):

#### Option A: Pay via Wallet

```bash
POST /bank-service-charges/me/pay
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "payment_method": "wallet",
  "amount": 30000  // Optional: defaults to full outstanding amount
}
```

**What Happens:**
1. ✅ Wallet is debited immediately
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

#### Option B: Pay via External Payment

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

### Step 4: Upload Payment Proof (For External Payments)

After making external payment, user uploads receipt/proof:

```bash
POST /bank-service-charges/me/files
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "file_url": "https://storage.example.com/bank-receipt.pdf"
}
```

**Response:**
```json
{
  "bsc_file_id": "file-uuid",
  "bsc_id": "bsc-uuid",
  "file_url": "https://storage.example.com/bank-receipt.pdf",
  "uploaded_at": "2024-01-15T13:00:00.000Z"
}
```

**Use Cases:**
- Bank transfer receipt
- Bank statement screenshot
- Payment confirmation slip
- Any proof of payment

### Step 5: View Uploaded Files

```bash
GET /bank-service-charges/me/files
Authorization: Bearer {user_token}
```

**Response:**
```json
[
  {
    "bsc_file_id": "file-uuid-1",
    "file_url": "https://storage.example.com/receipt1.pdf",
    "uploaded_at": "2024-01-15T13:00:00.000Z"
  },
  {
    "bsc_file_id": "file-uuid-2",
    "file_url": "https://storage.example.com/receipt2.pdf",
    "uploaded_at": "2024-01-15T14:00:00.000Z"
  }
]
```

---

## Admin Workflow

### Step 1: View All Service Charges in Estate

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
      "payment_frequency": "monthly",
      "bank_name": "Access Bank",
      "account_name": "Greenview Estate",
      "account_number": "1234567890",
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

### Step 2: View Specific Service Charge

Admin can view detailed service charge including files:

```bash
GET /bank-service-charges/me
# (Admin can access any user's service charge via direct database query)
```

### Step 3: Review Payment Files

Admin reviews uploaded payment receipts/proofs before validation.

### Step 4: Validate Service Charge Payment

```bash
PUT /bank-service-charges/{bscId}/validate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "is_validated": true,
  "notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
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
  "validated_at": "2024-01-15T15:00:00.000Z",
  "validated_by": "admin-uuid",
  "validation_notes": "Payment verified. Bank statement confirms ₦30,000 received on 2024-01-15"
}
```

**What Happens:**
- ✅ Service charge is marked as validated
- ✅ Validation timestamp is recorded
- ✅ Admin ID who validated is recorded
- ✅ Optional notes/comments are saved

**Validation States:**
- `is_validated: false` - Payment not yet validated (default)
- `is_validated: true` - Payment validated by admin

---

## Payment Frequencies

Service charges can be set to different payment frequencies:

### Monthly
- Paid every month
- Example: ₦50,000 per month

### Quarterly
- Paid every 3 months
- Example: ₦150,000 per quarter

### Yearly
- Paid once per year
- Example: ₦600,000 per year

---

## Payment Methods

### 1. Wallet Payment

**How It Works:**
- User's wallet balance is debited immediately
- Payment status is `SUCCESS` immediately
- Service charge balance updates automatically
- No external processing needed

**Use Case:** User has funds in wallet

**Example:**
```json
{
  "payment_method": "wallet",
  "amount": 30000
}
```

### 2. External Payment

**How It Works:**
- Payment record created with `PENDING` status
- User redirected to payment gateway (Paystack)
- Payment URL provided for card/bank transfer
- Webhook confirms payment completion
- Service charge balance updates after confirmation

**Use Case:** User pays via bank transfer or card

**Example:**
```json
{
  "payment_method": "external",
  "amount": 30000
}
```

**Payment Flow:**
1. Create payment → Status: `PENDING`
2. User pays via Paystack
3. Paystack webhook confirms → Status: `SUCCESS`
4. Service charge balance updates

---

## Partial Payments

Users can make **partial payments**:

```bash
POST /bank-service-charges/me/pay
{
  "payment_method": "wallet",
  "amount": 15000  // Pay ₦15,000 of ₦50,000
}
```

**Rules:**
- ✅ Can pay any amount up to outstanding balance
- ✅ Cannot pay more than outstanding balance
- ✅ Multiple partial payments allowed
- ✅ Outstanding balance tracks remaining amount

**Example Scenario:**
- Total charge: ₦50,000
- Payment 1: ₦20,000 → Outstanding: ₦30,000
- Payment 2: ₦15,000 → Outstanding: ₦15,000
- Payment 3: ₦15,000 → Outstanding: ₦0

---

## Complete Example Workflow

### Scenario: Resident Pays Monthly Service Charge

**Step 1: Resident Sets Up Service Charge**
```bash
POST /bank-service-charges
{
  "service_charge": 50000,
  "payment_frequency": "monthly",
  "bank_name": "Access Bank",
  "account_name": "Greenview Estate",
  "account_number": "1234567890"
}
```

**Step 2: Resident Pays Full Amount via Wallet**
```bash
POST /bank-service-charges/me/pay
{
  "payment_method": "wallet",
  "amount": 50000
}
```

**Result:**
- paid_charge: ₦50,000
- outstanding_charge: ₦0
- Payment Status: SUCCESS

**Step 3: Admin Validates Payment**
```bash
PUT /bank-service-charges/{bscId}/validate
{
  "is_validated": true,
  "notes": "Payment confirmed"
}
```

**Or, if Resident Paid Externally:**

**Step 2A: Resident Pays via Bank Transfer**
```bash
POST /bank-service-charges/me/pay
{
  "payment_method": "external",
  "amount": 50000
}
# Redirects to Paystack payment page
```

**Step 2B: Resident Uploads Bank Receipt**
```bash
POST /bank-service-charges/me/files
{
  "file_url": "https://storage.example.com/receipt.pdf"
}
```

**Step 2C: Admin Reviews Receipt**
- Admin views uploaded file
- Checks bank statement
- Verifies payment amount

**Step 2D: Admin Validates**
```bash
PUT /bank-service-charges/{bscId}/validate
{
  "is_validated": true,
  "notes": "Bank transfer confirmed. Reference: T123456789"
}
```

---

## API Endpoints Summary

### User Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bank-service-charges` | POST | Create service charge record |
| `/bank-service-charges/me` | GET | Get my service charge |
| `/bank-service-charges/me` | PUT | Update service charge |
| `/bank-service-charges/me/pay` | POST | Pay service charge |
| `/bank-service-charges/me/files` | POST | Upload payment proof |
| `/bank-service-charges/me/files` | GET | Get uploaded files |
| `/bank-service-charges/me/files/:fileId` | DELETE | Delete file |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bank-service-charges` | GET | Get all service charges |
| `/bank-service-charges/estate/:estateId` | GET | Get estate service charges |
| `/bank-service-charges/:bscId/validate` | PUT | Validate payment |

---

## Validation Process

### Why Validation?

- **External Payments** - Verify bank transfers actually went through
- **Audit Trail** - Record who validated and when
- **Payment Confirmation** - Ensure estate received payment
- **Dispute Resolution** - Track validation history

### Validation Fields

- `is_validated` - Boolean flag
- `validated_at` - Timestamp of validation
- `validated_by` - Admin user ID who validated
- `validation_notes` - Admin comments/notes

### Validation States

**Not Validated** (`is_validated: false`)
- Payment uploaded but not reviewed
- Admin hasn't confirmed payment receipt
- Default state

**Validated** (`is_validated: true`)
- Admin confirmed payment received
- Payment verified against bank records
- Estate acknowledges payment

---

## Key Features

### 1. **Single Record Per User**
- Each user has only ONE service charge record
- Can update it but cannot create duplicates

### 2. **Automatic Balance Tracking**
- `outstanding_charge` automatically calculated
- Updates when payments are made
- Formula: `outstanding = total - paid`

### 3. **Multiple Payment Methods**
- Wallet (instant)
- External (Paystack/bank transfer)

### 4. **File Management**
- Upload multiple payment proofs
- Delete files if needed
- Track upload timestamps

### 5. **Admin Validation**
- Estate admins validate payments
- Track validation history
- Add notes/comments

### 6. **Estate Scoping**
- Admins see only their estate's charges
- Filter by estate for management

---

## Common Scenarios

### Scenario 1: Full Payment via Wallet

```bash
# 1. View current charge
GET /bank-service-charges/me
# outstanding_charge: ₦50,000

# 2. Pay full amount
POST /bank-service-charges/me/pay
{ "payment_method": "wallet" }
# No amount specified = pays full outstanding

# 3. Check updated balance
GET /bank-service-charges/me
# outstanding_charge: ₦0 ✅
```

### Scenario 2: Partial Payment with Receipt

```bash
# 1. Pay partial amount
POST /bank-service-charges/me/pay
{ "payment_method": "external", "amount": 30000 }

# 2. Upload receipt
POST /bank-service-charges/me/files
{ "file_url": "https://storage.example.com/receipt.pdf" }

# 3. Admin validates
PUT /bank-service-charges/{bscId}/validate
{ "is_validated": true, "notes": "Confirmed" }
```

### Scenario 3: Multiple Partial Payments

```bash
# Payment 1: ₦20,000
POST /bank-service-charges/me/pay
{ "payment_method": "wallet", "amount": 20000 }
# Outstanding: ₦30,000

# Payment 2: ₦15,000
POST /bank-service-charges/me/pay
{ "payment_method": "wallet", "amount": 15000 }
# Outstanding: ₦15,000

# Payment 3: ₦15,000
POST /bank-service-charges/me/pay
{ "payment_method": "wallet", "amount": 15000 }
# Outstanding: ₦0 ✅
```

---

## Data Model

### BankServiceCharge Entity

```typescript
{
  bsc_id: string (UUID)
  user_id: string
  service_charge: number (Total amount)
  paid_charge: number (Amount paid)
  outstanding_charge: number (Remaining)
  payment_frequency: 'monthly' | 'quarterly' | 'yearly'
  bank_name: string
  account_name: string
  account_number: string
  is_validated: boolean
  validated_at: Date | null
  validated_by: string | null
  validation_notes: string | null
  created_at: Date
  updated_at: Date
}
```

### BankServiceChargeFile Entity

```typescript
{
  bsc_file_id: string (UUID)
  bsc_id: string
  file_url: string
  uploaded_at: Date
}
```

---

## Important Notes

1. **One Record Per User** - Users can only create one service charge record
2. **Automatic Calculations** - Outstanding balance is auto-calculated
3. **Payment Tracking** - All payments create Payment records
4. **Validation Optional** - Validation is for admin confirmation, not required for payment
5. **Partial Payments** - Users can pay in installments
6. **File Uploads** - Users can upload multiple payment proofs
7. **Estate Scoping** - Admins only see their estate's charges

---

## Error Handling

### Common Errors

**"Bank service charge record already exists"**
- User already created a record
- Update existing record instead

**"Payment amount cannot exceed outstanding charge"**
- Trying to pay more than remaining balance
- Check outstanding_charge before paying

**"Bank service charge record not found"**
- User hasn't created service charge record yet
- Create record first

**"Payment amount must be greater than 0"**
- Invalid payment amount
- Ensure amount is positive

---

## Best Practices

1. **Create Record Once** - Set up service charge record when joining estate
2. **Upload Receipts** - Always upload payment proof for external payments
3. **Admin Validation** - Admins should validate payments promptly
4. **Check Balance** - Verify outstanding balance before making payments
5. **Partial Payments** - Can split large payments across multiple transactions
6. **Keep Records** - Maintain uploaded files for audit purposes

---

**Last Updated:** January 2024  
**Version:** 1.0

