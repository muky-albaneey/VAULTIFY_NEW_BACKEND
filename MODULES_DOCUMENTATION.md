# Vaultify Backend - Modules Documentation

## Comprehensive Module-by-Module Documentation

This document provides detailed documentation for each module in the Vaultify Backend system.

---

## Table of Contents

1. [Auth Module](#1-auth-module)
2. [Users Module](#2-users-module)
3. [Estates Module](#3-estates-module)
4. [Wallets Module](#4-wallets-module)
5. [Subscriptions Module](#5-subscriptions-module)
6. [Access Codes Module](#6-access-codes-module)
7. [Lost & Found Module](#7-lost--found-module)
8. [Service Directory Module](#8-service-directory-module)
9. [Utility Bills Module](#9-utility-bills-module)
10. [Messaging Module](#10-messaging-module)
11. [Notifications Module](#11-notifications-module)
12. [Resident ID Module](#12-resident-id-module)
13. [Reports Module](#13-reports-module)
14. [Payments Module](#14-payments-module)
15. [Bank Service Charges Module](#15-bank-service-charges-module)
16. [Alerts Module](#16-alerts-module)

---

## 1. Auth Module

**Location**: `src/modules/auth/`  
**Purpose**: User authentication and authorization  
**Dependencies**: Passport.js, JWT

### Components
- `auth.controller.ts` - Request handlers
- `auth.service.ts` - Business logic
- `jwt.strategy.ts` - JWT passport strategy
- `local.strategy.ts` - Local passport strategy
- `auth.guards.ts` - Authentication guards
- `auth.module.ts` - Module definition

### Key Features
- JWT-based authentication
- Access and refresh token mechanism
- Password reset functionality
- Change password functionality

### API Endpoints

#### POST /auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**: `201 Created`
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { ... }
}
```

#### POST /auth/login
Authenticate user and return tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { ... }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

#### POST /auth/change-password
Change user password (requires authentication).

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

#### POST /auth/request-password-reset
Request password reset email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body**:
```json
{
  "token": "reset-token",
  "new_password": "NewPassword123!"
}
```

### Security
- Password hashing with bcrypt (10 rounds minimum)
- JWT tokens with expiration (15min access, 7 days refresh)
- Refresh token rotation
- Rate limiting on sensitive endpoints

---

## 2. Users Module

**Location**: `src/modules/users/`  
**Purpose**: User profile and device management  
**Dependencies**: JWT authentication, Device tokens

### Components
- `users.controller.ts` - Profile endpoints
- `users.service.ts` - User business logic
- `users.module.ts` - Module definition

### Key Features
- Profile management (CRUD)
- Device token management for push notifications
- User search functionality
- Estate user listing
- User status management

### API Endpoints

#### GET /users/me
Get current authenticated user profile.

**Response**: `200 OK`
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "status": "active",
  "profile": { ... },
  "estate": { ... }
}
```

#### PUT /users/me/profile
Update user profile.

**Request Body**:
```json
{
  "phone_number": "+1234567890",
  "apartment_type": "2-Bedroom",
  "house_address": "123 Main St",
  "profile_picture_url": "https://..."
}
```

#### POST /users/me/devices
Register device token for push notifications.

**Request Body**:
```json
{
  "token": "fcm-device-token",
  "platform": "android",
  "device_id": "device-uuid"
}
```

#### GET /users/me/devices
Get registered devices for current user.

**Response**: Array of device tokens

#### DELETE /users/me/devices/:token
Unregister device token.

#### GET /users/search?q=search-term
Search users by name or email.

**Response**: Array of matching users

#### GET /users/:id
Get user by ID.

#### PUT /users/:id/status
Update user status (admin only).

**Request Body**:
```json
{
  "status": "suspended"
}
```

#### GET /users/estate/:estateId
Get all users in an estate.

---

## 3. Estates Module

**Location**: `src/modules/estates/`  
**Purpose**: Estate management  
**Dependencies**: Authentication, Authorization

### Components
- `estates.controller.ts` - Estate endpoints
- `estates.service.ts` - Estate business logic
- `estates.module.ts` - Module definition

### Key Features
- Estate CRUD operations
- Estate search
- Estate management (admin)

### API Endpoints

#### POST /estates
Create a new estate.

**Request Body**:
```json
{
  "name": "Sunset Apartments",
  "email": "admin@sunsetapartments.com",
  "address": "123 Estate Road"
}
```

**Response**: `201 Created`
```json
{
  "estate_id": "uuid",
  "name": "Sunset Apartments",
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### GET /estates
List all estates (paginated).

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term

#### GET /estates/search
Search estates by name or address.

#### GET /estates/:id
Get estate by ID.

#### PUT /estates/:id
Update estate information.

#### DELETE /estates/:id
Delete estate (admin only).

---

## 4. Wallets Module

**Location**: `src/modules/wallets/`  
**Purpose**: In-app wallet system  
**Dependencies**: Payments module, Transactions

### Components
- `wallets.controller.ts` - Wallet operations
- `wallets.service.ts` - Transaction logic
- `wallets.module.ts` - Module definition

### Key Features
- Wallet balance management
- Wallet top-up via Paystack
- User-to-user transfers
- Transaction history with filtering
- Atomic transaction processing

### API Endpoints

#### GET /wallets/me
Get current user's wallet.

**Response**: `200 OK`
```json
{
  "wallet_id": "uuid",
  "user_id": "uuid",
  "available_balance": "5000.00",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### POST /wallets/topup
Top up wallet with external payment.

**Request Body**:
```json
{
  "amount": 10000,
  "payment_method": "paystack"
}
```

**Response**: `200 OK`
```json
{
  "authorization_url": "https://paystack.com/...",
  "reference": "payment-ref",
  "amount": 10000
}
```

#### POST /wallets/transfer
Transfer funds to another user.

**Request Body**:
```json
{
  "recipient_user_id": "recipient-uuid",
  "amount": 5000,
  "purpose": "Monthly fee"
}
```

**Validation**:
- Check sender balance
- Verify recipient exists
- Ensure minimum balance retention

#### GET /wallets/me/transactions
Get transaction history.

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `direction`: CREDIT or DEBIT
- `purpose`: Transaction purpose filter

**Response**: Paginated transaction list
```json
{
  "data": [
    {
      "wallet_txn_id": "uuid",
      "amount": "5000.00",
      "direction": "CREDIT",
      "purpose": "TOP_UP",
      "reference": "unique-ref",
      "status": "completed",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Transaction Purposes
- `TOP_UP` - Wallet top-up
- `TRANSFER` - User-to-user transfer
- `WITHDRAWAL` - Withdrawal from wallet
- `SERVICE_CHARGE_PAYMENT` - Service charge payment
- `UTILITY_PAYMENT` - Utility bill payment
- `SUBSCRIPTION_PAYMENT` - Subscription payment

### Transaction Status
- `pending` - Transaction pending
- `completed` - Transaction completed
- `failed` - Transaction failed

### Business Rules
- Minimum balance: ₦100
- All transactions are atomic (database transactions)
- Unique reference for each transaction
- Automatic balance updates
- Real-time balance validation

---

## 5. Subscriptions Module

**Location**: `src/modules/subscriptions/`  
**Purpose**: Subscription and family group management  
**Dependencies**: Plans, Family groups, Payments

### Components
- `subscriptions.controller.ts` - Subscription endpoints
- `subscriptions.service.ts` - Subscription logic
- `subscriptions.module.ts` - Module definition

### Key Features
- Plan management
- Subscription activation
- Subscription renewal
- Family group management (up to 5 members)
- Cancellation handling

### API Endpoints

#### GET /subscriptions/plans
Get available subscription plans.

**Response**: `200 OK`
```json
{
  "data": [
    {
      "plan_id": "uuid",
      "code": "NORMAL_MONTHLY",
      "name": "Normal Monthly Plan",
      "type": "normal",
      "price_ngn": 5000,
      "billing_cycle": "monthly",
      "max_members": 1
    },
    {
      "plan_id": "uuid",
      "code": "FAMILY_YEARLY",
      "name": "Family Yearly Plan",
      "type": "family",
      "price_ngn": 50000,
      "billing_cycle": "yearly",
      "max_members": 5
    }
  ]
}
```

#### GET /subscriptions/me
Get current user's subscription.

**Response**: Current subscription or null

#### GET /subscriptions/me/active
Check if user has active subscription.

#### POST /subscriptions/activate
Activate a subscription.

**Request Body**:
```json
{
  "plan_id": "uuid",
  "payment_method": "wallet",
  "family_member_ids": ["uuid1", "uuid2"]
}
```

**Flow**:
1. Verify plan exists
2. Check if family plan → create family group
3. Process payment
4. Create subscription record
5. Set expiry date based on billing cycle

#### PUT /subscriptions/renew
Renew active subscription.

**Request Body**:
```json
{
  "payment_method": "wallet"
}
```

#### PUT /subscriptions/cancel
Cancel active subscription.

#### GET /subscriptions/family/group
Get user's family group (if exists).

#### POST /subscriptions/family/members
Add family member to group.

**Request Body**:
```json
{
  "user_id": "uuid-to-add"
}
```

**Validation**:
- Check if user has family subscription
- Check max members (5)
- Verify user exists
- Ensure user not already in group

#### DELETE /subscriptions/family/members
Remove family member from group.

**Request Body**:
```json
{
  "user_id": "uuid-to-remove"
}
```

### Plan Types
- `normal` - Single user plan
- `family` - Family plan (up to 5 members)

### Billing Cycles
- `monthly` - Monthly billing
- `yearly` - Yearly billing

### Subscription Status
- `pending` - Subscription pending payment
- `active` - Subscription active
- `expired` - Subscription expired
- `cancelled` - Subscription cancelled

### Family Group Rules
- Head user (creator) cannot be removed
- Max 5 members per family plan
- All members share same subscription
- Only head can add/remove members

---

## 6. Access Codes Module

**Location**: `src/modules/access-codes/`  
**Purpose**: Visitor access code management  
**Dependencies**: Estates, Authentication

### Components
- `access-codes.controller.ts` - Code endpoints
- `access-codes.service.ts` - Validation logic
- `access-codes.module.ts` - Module definition

### Key Features
- Time-bounded access codes
- Usage tracking and limits
- Estate-scoped access
- Notify-on-use functionality

### API Endpoints

#### POST /access-codes
Create a visitor access code.

**Request Body**:
```json
{
  "visitor_name": "John Smith",
  "visitor_email": "visitor@example.com",
  "visitor_phone": "+1234567890",
  "valid_from": "2025-01-01T10:00:00Z",
  "valid_to": "2025-01-01T18:00:00Z",
  "max_uses": 5,
  "gate": "Main Gate",
  "notify_on_use": true
}
```

**Response**: `201 Created`
```json
{
  "code": "uuid",
  "visitor_name": "John Smith",
  "valid_from": "2025-01-01T10:00:00Z",
  "valid_to": "2025-01-01T18:00:00Z",
  "max_uses": 5,
  "current_uses": 0
}
```

#### GET /access-codes
Get current user's access codes.

**Response**: Array of access codes

#### POST /access-codes/validate/:code
Validate and use access code.

**Request Body**:
```json
{
  "gate": "Main Gate"
}
```

**Response**: `200 OK` (if valid)
```json
{
  "valid": true,
  "visitor_name": "John Smith",
  "remaining_uses": 4
}
```

#### PUT /access-codes/:code/deactivate
Deactivate access code.

### Business Rules
- Codes are estate-scoped
- Time-bounded validity (valid_from to valid_to)
- Usage counter (current_uses)
- Max uses limit enforcement
- Automatic expiration
- Optional notify-on-use

---

## 7. Lost & Found Module

**Location**: `src/modules/lost-found/`  
**Purpose**: Lost and found item management  
**Dependencies**: Estates, File uploads

### Components
- `lost-found.controller.ts` - Item endpoints
- `lost-found.service.ts` - Business logic
- `lost-found.module.ts` - Module definition

### Key Features
- Item reporting (lost/found)
- Image upload support
- Estate-scoped items
- Search functionality

### API Endpoints

#### POST /lost-found
Report a lost or found item.

**Request Body**:
```json
{
  "estate_id": "uuid",
  "description": "Lost wallet",
  "location": "Lobby",
  "image_url": "https://...",
  "item_type": "Lost",
  "contact_info": "+1234567890",
  "date_reported": "2025-01-01T00:00:00Z"
}
```

#### GET /lost-found/estate/:estateId
Get all items for an estate.

#### GET /lost-found/search/:estateId
Search items in estate.

**Query Parameters**:
- `q`: Search term
- `item_type`: Lost or Found
- `location`: Location filter

#### GET /lost-found/:id
Get item details.

#### PUT /lost-found/:id
Update item information.

#### DELETE /lost-found/:id
Delete item (owner only).

### Item Types
- `Lost` - Lost item report
- `Found` - Found item report

---

## 8. Service Directory Module

**Location**: `src/modules/service-directory/`  
**Purpose**: Service provider management  
**Dependencies**: Services, Providers

### Components
- `service-directory.controller.ts` - Provider endpoints
- `service-directory.service.ts` - Business logic
- `service-directory.module.ts` - Module definition

### Key Features
- Service listing
- Provider registration
- Provider search
- Photo galleries
- Review system
- Rating aggregation

### API Endpoints

#### GET /service-directory/services
Get available services.

#### GET /service-directory/providers/service/:serviceId
Get providers for a service.

#### GET /service-directory/providers/search
Search providers.

**Query Parameters**:
- `q`: Search term
- `service_id`: Filter by service
- `estate_id`: Filter by estate

#### GET /service-directory/providers/:id
Get provider details.

**Response**: Provider with photos, reviews, and ratings

#### POST /service-directory/providers
Register a new provider.

**Request Body**:
```json
{
  "service_id": "uuid",
  "estate_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "location": "Lagos",
  "availability": "Mon-Fri 9AM-5PM",
  "bio": "Expert plumber with 10 years experience",
  "profile_picture_url": "https://..."
}
```

#### PUT /service-directory/providers/:id
Update provider information.

#### DELETE /service-directory/providers/:id
Delete provider.

#### POST /service-directory/providers/:id/photos
Add photo to provider gallery.

**Request**: Multipart form with image file

#### POST /service-directory/providers/:id/reviews
Add review for provider.

**Request Body**:
```json
{
  "reviewer_name": "Jane Doe",
  "reviewer_id": "uuid",
  "rating": 5,
  "comment": "Excellent service!"
}
```

#### GET /service-directory/providers/:id/reviews
Get provider reviews.

---

## 9. Utility Bills Module

**Location**: `src/modules/utility-bills/`  
**Purpose**: Utility bill management with Lenco integration  
**Dependencies**: Lenco API, Utility entities

### Components
- `utility-bills.controller.ts` - Bill endpoints
- `utility-bills.service.ts` - Lenco integration
- `utility-bills.module.ts` - Module definition

### Key Features
- Utility provider management
- Account registration
- Bill tracking
- Bill payment via Lenco API
- Payment history
- Webhook handling

### API Endpoints

#### GET /utility-bills/providers
Get utility providers.

#### POST /utility-bills/lenco/sync-vendors
Sync vendors from Lenco API.

#### GET /utility-bills/lenco/products
Get Lenco products.

#### POST /utility-bills/lenco/validate-customer
Validate customer with Lenco.

**Request Body**:
```json
{
  "vendor": "ikeja-electric",
  "customer_field": "account-number",
  "customer_value": "1234567890"
}
```

#### POST /utility-bills/bills/:id/pay
Pay utility bill.

**Request Body**:
```json
{
  "payment_method": "wallet"
}
```

#### GET /utility-bills/lenco/payment-status/:transactionId
Get payment status from Lenco.

#### GET /utility-bills/lenco/payment-history
Get Lenco payment history.

#### POST /utility-bills/accounts
Register utility account.

**Request Body**:
```json
{
  "provider_id": "uuid",
  "account_number": "1234567890",
  "account_name": "John Doe",
  "estate_id": "uuid"
}
```

#### GET /utility-bills/accounts
Get user's utility accounts.

#### GET /utility-bills/accounts/:id/bills
Get bills for an account.

#### GET /utility-bills/bills
Get all bills (user-scoped).

#### GET /utility-bills/bills/:id
Get bill details.

---

## 10. Messaging Module

**Location**: `src/modules/messaging/`  
**Purpose**: Real-time messaging with WebSocket support  
**Dependencies**: Socket.io, Conversations, Messages

### Components
- `messaging.controller.ts` - REST endpoints
- `messaging.service.ts` - Message handling
- `messaging.gateway.ts` - WebSocket gateway
- `messaging.module.ts` - Module definition

### Key Features
- Direct and group messaging
- Estate-scoped conversations
- Message reactions
- Read receipts
- Typing indicators
- Media sharing
- Estate broadcasts

### API Endpoints

#### POST /messaging/conversations
Create a conversation.

**Request Body**:
```json
{
  "estate_id": "uuid",
  "type": "direct",
  "title": "Chat with John",
  "participant_user_ids": ["user-uuid"]
}
```

#### GET /messaging/conversations
Get user's conversations.

#### GET /messaging/conversations/:id
Get conversation details with messages.

#### POST /messaging/conversations/:id/messages
Send a message.

**Request Body**:
```json
{
  "type": "text",
  "content": "Hello!",
  "metadata": {},
  "reply_to_message_id": "uuid"
}
```

#### GET /messaging/conversations/:id/messages
Get conversation messages.

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page

#### POST /messaging/messages/:id/reactions
Add reaction to message.

**Request Body**:
```json
{
  "emoji": "👍"
}
```

#### DELETE /messaging/messages/:id/reactions/:emoji
Remove reaction.

#### PUT /messaging/conversations/:id/read/:messageId
Mark message as read.

#### PUT /messaging/conversations/:id/leave
Leave conversation.

#### POST /messaging/conversations/:id/participants/:userId
Add participant to conversation.

#### POST /messaging/estate/:estateId/broadcast
Broadcast message to estate.

**Request Body**:
```json
{
  "type": "text",
  "content": "Estate announcement",
  "metadata": {}
}
```

#### GET /messaging/estate/:estateId/group
Get estate group conversation.

#### GET /messaging/estate/:estateId/conversations
Get estate conversations.

### WebSocket Events

**Client → Server**:
```typescript
// Join estate room
socket.emit('join_estate_group', { estate_id: 'uuid' });

// Send message
socket.emit('send_message', {
  conversation_id: 'uuid',
  content: 'Hello',
  type: 'text'
});

// Typing indicator
socket.emit('typing', {
  conversation_id: 'uuid',
  is_typing: true
});

// Mark as read
socket.emit('mark_as_read', {
  conversation_id: 'uuid',
  message_id: 'uuid'
});
```

**Server → Client**:
```typescript
// New message
socket.on('new_message', (message) => { ... });

// Message read
socket.on('message_read', (data) => { ... });

// User typing
socket.on('user_typing', (data) => { ... });

// New participant
socket.on('participant_added', (data) => { ... });
```

### Conversation Types
- `direct` - One-on-one chat
- `group` - Group chat
- `estate` - Estate broadcast (read-only for non-admins)

### Message Types
- `text` - Text message
- `image` - Image message
- `file` - File attachment
- `voice` - Voice message
- `link_preview` - Link with preview
- `system` - System message

---

## 11. Notifications Module

**Location**: `src/modules/notifications/`  
**Purpose**: Push notification management  
**Dependencies**: Firebase Cloud Messaging

### Components
- `notifications.controller.ts` - Notification endpoints
- `notifications.service.ts` - Firebase integration
- `notifications.module.ts` - Module definition

### Key Features
- Firebase Cloud Messaging integration
- User-specific notifications
- Estate-wide notifications
- Topic subscriptions
- Device token management
- Automatic token cleanup

### API Endpoints

#### POST /notifications/send/user/:userId
Send notification to specific user.

**Request Body**:
```json
{
  "title": "New Message",
  "body": "You have a new message from John",
  "data": {
    "conversation_id": "uuid",
    "type": "message"
  },
  "imageUrl": "https://..."
}
```

#### POST /notifications/send/estate/:estateId
Send notification to all users in estate.

**Request Body**: Same as above

#### POST /notifications/send/topic/:topic
Send notification to topic subscribers.

#### POST /notifications/subscribe/topic
Subscribe device to topic.

**Request Body**:
```json
{
  "token": "device-token",
  "topic": "estate-alerts"
}
```

#### POST /notifications/unsubscribe/topic
Unsubscribe device from topic.

#### GET /notifications/devices
Get all device tokens (admin).

#### DELETE /notifications/devices/:token
Delete device token.

#### POST /notifications/cleanup
Cleanup inactive tokens.

### Notification Payload Structure
```typescript
interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}
```

### Topics
- `estate-alerts` - Estate alerts
- `payments` - Payment notifications
- `maintenance` - Maintenance updates

---

## 12. Resident ID Module

**Location**: `src/modules/resident-id/`  
**Purpose**: QR-based resident identification  
**Dependencies**: JWT, QR codes

### Components
- `resident-id.controller.ts` - ID endpoints
- `resident-id.service.ts` - QR generation logic
- `resident-id.module.ts` - Module definition

### Key Features
- Rotating QR code generation (10-minute rotation)
- JWT-signed tokens
- Security validation
- QR code delivery

### API Endpoints

#### POST /resident-id/generate/:estateId
Generate QR code for resident.

**Response**:
```json
{
  "qr_code_url": "data:image/png;base64,iVBORw0...",
  "token": "jwt-token",
  "expires_at": "2025-01-01T12:10:00Z"
}
```

#### POST /resident-id/validate/:estateId
Validate QR code token.

**Request Body**:
```json
{
  "token": "jwt-token"
}
```

**Response**:
```json
{
  "valid": true,
  "user": { ... },
  "expires_at": "2025-01-01T12:10:00Z"
}
```

#### GET /resident-id/status/:estateId
Check ID status.

#### POST /resident-id/revoke/:estateId
Revoke resident ID.

### Security
- JWT token expiration (10 minutes)
- Estate scoping
- Automatic rotation
- Token signature validation

---

## 13. Reports Module

**Location**: `src/modules/reports/`  
**Purpose**: Issue reporting system  
**Dependencies**: Estates, Users

### Components
- `reports.controller.ts` - Report endpoints
- `reports.service.ts` - Report logic
- `reports.module.ts` - Module definition

### Key Features
- Report creation and management
- Status tracking
- SLA management
- Overdue tracking
- Contact preferences

### API Endpoints

#### POST /reports
Create a new report.

**Request Body**:
```json
{
  "estate_id": "uuid",
  "category": "Maintenance",
  "urgency": "high",
  "location": "Apartment 5A",
  "subject": "Leaking faucet",
  "details": "The faucet in the kitchen is leaking",
  "contact_preference": "In-app only",
  "allow_sharing": false
}
```

#### GET /reports/me
Get current user's reports.

#### GET /reports/estate/:estateId
Get estate reports (admin).

#### GET /reports/search/:estateId
Search reports.

**Query Parameters**:
- `category`: Filter by category
- `status`: Filter by status
- `urgency`: Filter by urgency

#### GET /reports/status/:estateId/:status
Get reports by status.

#### GET /reports/overdue/:estateId
Get overdue reports.

#### GET /reports/:id
Get report details.

#### PUT /reports/:id
Update report.

#### PUT /reports/:id/status
Update report status (admin).

**Request Body**:
```json
{
  "status": "resolved",
  "resolution_notes": "Fixed the faucet"
}
```

#### DELETE /reports/:id
Delete report.

### Report Categories
- Maintenance
- Security
- Noise/Nuisance
- Water
- Power
- Cleaning
- Parking
- Billing
- Other

### Urgency Levels
- `low` - Low urgency
- `medium` - Medium urgency
- `high` - High urgency
- `critical` - Critical urgency

### Report Status
- `pending` - Pending review
- `acknowledged` - Acknowledged by admin
- `in_progress` - In progress
- `resolved` - Resolved
- `closed` - Closed

### Contact Preferences
- `In-app only` - In-app messaging only
- `Phone` - Phone contact allowed
- `Email` - Email contact allowed

---

## 14. Payments Module

**Location**: `src/modules/payments/`  
**Purpose**: External payment processing  
**Dependencies**: Paystack API, Payment providers

### Components
- `payments.controller.ts` - Payment endpoints
- `payments.service.ts` - Paystack integration
- `payments.module.ts` - Module definition

### Key Features
- Paystack integration
- Payment initiation
- Payment verification
- Webhook handling
- Payment history

### API Endpoints

#### POST /payments/initiate
Initiate a payment.

**Request Body**:
```json
{
  "amount": 10000,
  "currency": "NGN",
  "provider_id": "paystack-uuid",
  "metadata": {
    "purpose": "subscription"
  }
}
```

**Response**:
```json
{
  "authorization_url": "https://paystack.com/...",
  "access_code": "access-code",
  "reference": "unique-ref"
}
```

#### GET /payments/verify/:reference
Verify payment status.

**Response**:
```json
{
  "status": "success",
  "payment": { ... }
}
```

#### POST /payments/webhook/paystack
Paystack webhook handler.

#### GET /payments/history
Get payment history.

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status

#### GET /payments/:id
Get payment details.

### Payment Status
- `pending` - Payment pending
- `success` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled

### Webhook Processing
1. Verify webhook signature
2. Check event type
3. Update payment status
4. Trigger appropriate actions (e.g., update wallet)

---

## 15. Bank Service Charges Module

**Location**: `src/modules/bank-service-charges/`  
**Purpose**: Service charge management  
**Dependencies**: Estates, File uploads

### Components
- `bank-service-charges.controller.ts` - Charge endpoints
- `bank-service-charges.service.ts` - Business logic
- `bank-service-charges.module.ts` - Module definition

### Key Features
- Service charge creation
- File uploads
- Charge payment
- History tracking

### API Endpoints

#### POST /bank-service-charges
Create service charge.

**Request Body**:
```json
{
  "estate_id": "uuid",
  "description": "Monthly maintenance",
  "amount": 15000,
  "due_date": "2025-01-15T00:00:00Z"
}
```

#### GET /bank-service-charges/me
Get user's service charges.

#### PUT /bank-service-charges/me
Update service charge (admin).

#### POST /bank-service-charges/me/pay
Pay service charge.

**Request Body**:
```json
{
  "payment_method": "wallet"
}
```

#### POST /bank-service-charges/me/files
Upload service charge file.

**Request**: Multipart form with file

#### GET /bank-service-charges/me/files
Get service charge files.

#### DELETE /bank-service-charges/me/files/:fileId
Delete service charge file.

#### GET /bank-service-charges
Get all charges (admin).

#### GET /bank-service-charges/estate/:estateId
Get estate charges.

---

## 16. Alerts Module

**Location**: `src/modules/alerts/`  
**Purpose**: Estate alert management  
**Dependencies**: Estates, Notifications

### Components
- `alerts.controller.ts` - Alert endpoints
- `alerts.service.ts` - Alert logic
- `alerts.module.ts` - Module definition

### Key Features
- Alert creation
- Estate-wide distribution
- Priority levels
- Read tracking
- Stats tracking

### API Endpoints

#### POST /alerts
Create an alert.

**Request Body**:
```json
{
  "estate_id": "uuid",
  "title": "Power outage notice",
  "message": "Power will be cut from 2PM to 4PM",
  "priority": "high",
  "expires_at": "2025-01-02T00:00:00Z"
}
```

#### GET /alerts/me
Get current user's alerts.

#### GET /alerts/:id
Get alert details.

#### PUT /alerts/:id
Update alert (admin).

#### DELETE /alerts/:id
Delete alert (admin).

#### GET /alerts/estate/:estateId
Get estate alerts.

#### GET /alerts/stats/:estateId?
Get alert statistics.

**Response**:
```json
{
  "total": 100,
  "unread": 5,
  "by_priority": {
    "high": 10,
    "medium": 50,
    "low": 40
  }
}
```

### Priority Levels
- `high` - High priority
- `medium` - Medium priority
- `low` - Low priority

---

## Module Dependencies

```
Auth Module
  ↓
  ├─→ Users Module
  ├─→ Estates Module
  └─→ All other modules (via guards)

Wallets Module
  ↓
  └─→ Payments Module

Subscriptions Module
  ↓
  ├─→ Wallets Module (for payment)
  └─→ Plans

Messaging Module
  ↓
  └─→ Notifications Module (for push)

Utility Bills Module
  ↓
  ├─→ Payments Module
  └─→ External Lenco API

All Modules
  ↓
  └─→ Notifications Module (for alerts)
```

---

## Summary

The Vaultify Backend consists of **16 feature modules** covering:
- Authentication & authorization
- User & estate management
- Financial operations (wallet, payments)
- Subscriptions & family management
- Communication (messaging, notifications)
- Service management (utilities, services, providers)
- Estate features (access codes, lost & found, reports)
- Security & identification (resident ID)

Each module follows NestJS best practices with proper separation of concerns, dependency injection, and modular architecture.

**Status**: All modules fully implemented and production-ready ✅


