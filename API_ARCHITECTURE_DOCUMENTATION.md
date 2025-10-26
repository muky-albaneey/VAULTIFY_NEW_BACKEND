# Vaultify Backend - Complete API Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [Module Architecture](#module-architecture)
6. [API Design Patterns](#api-design-patterns)
7. [Security Architecture](#security-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [Data Flow & Integration](#data-flow--integration)
10. [Error Handling & Logging](#error-handling--logging)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Architecture](#deployment-architecture)

---

## Overview

Vaultify Backend is a comprehensive estate management platform built with NestJS. It provides a complete backend solution for managing residential estates with features including user management, wallet system, subscriptions, messaging, utility bills, and more.

### Key Capabilities
- **Multi-tenancy**: Estate-scoped data isolation
- **Real-time Communication**: WebSocket-based messaging
- **Payment Processing**: Integrated wallet and external payments
- **Push Notifications**: Firebase Cloud Messaging integration
- **Role-based Access Control**: Admin, Security, Residence roles
- **QR-based Resident ID**: Secure rotating identification system

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Clients                       │
│          Mobile Apps (iOS/Android) + Web Application         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/WSS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    NestJS Application Layer                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Controllers Layer                     │   │
│  │  • Auth, Users, Estates, Wallets, Payments, etc.      │   │
│  └────────────────────┬──────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼──────────────────────────────────┐   │
│  │              Business Logic Layer                       │   │
│  │  • Services, Guards, Interceptors, Filters             │   │
│  └────────────────────┬──────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼──────────────────────────────────┐   │
│  │              Data Access Layer                          │   │
│  │  • TypeORM Repositories, Migrations                     │   │
│  └────────────────────┬──────────────────────────────────┘   │
└────────────────────────┼──────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
    ┌─────▼──────┐              ┌──────▼──────┐
    │ PostgreSQL │              │  Firebase   │
    │  Database  │              │  Messaging  │
    └────────────┘              └─────────────┘
```

### Request Flow
```
1. Client Request → API Gateway
2. Authentication Check → JWT Validation
3. Authorization Check → Role & Estate Guards
4. Input Validation → Zod Schemas
5. Rate Limiting → Guard Check
6. Business Logic → Service Layer
7. Data Access → TypeORM Repository
8. Response → JSON Serialization
9. Logging → Request/Response Tracking
```

---

## Technology Stack

### Core Technologies
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 15
- **ORM**: TypeORM 0.3.x

### Additional Technologies
- **Authentication**: Passport.js + JWT
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Real-time**: Socket.io
- **Notifications**: Firebase Cloud Messaging
- **Payments**: Paystack API
- **Storage**: AWS S3 (Linode Object Storage)
- **QR Codes**: QRCode library

### Development Tools
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: TypeORM Migrations
- **Code Quality**: ESLint + Prettier
- **Environment**: ConfigModule (@nestjs/config)

---

## Database Architecture

### Entity Relationship Overview
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Users     │────────▶│ UserProfiles │────────▶│  Estates    │
└──────┬──────┘         └──────────────┘         └──────┬──────┘
       │                                                │
       │                                                │
       ├────────┐                                       │
       │        │                                       │
       ▼        ▼                                       │
┌──────────┐  ┌─────────────┐                         │
│ Wallets  │  │Subscriptions│                         │
└────┬─────┘  └──────┬──────┘                         │
     │               │                                 │
     ▼               ▼                                 │
┌─────────────┐  ┌───────────────┐                    │
│Transaction  │  │FamilyGroups   │                    │
└─────────────┘  └───────┬───────┘                    │
                        │                             │
                        ▼                             │
                   ┌──────────┐                       │
                   │  Family  │                       │
                   │ Members  │                       │
                   └──────────┘                       │
```

### Core Tables

#### 1. **Users & Profiles**
- `users`: Core user authentication data
- `user_profiles`: Extended user information (roles, apartment types)
- **Relationships**: One-to-one with profiles, many-to-one with estates

#### 2. **Estate System**
- `estates`: Estate information and settings
- **Purpose**: Multi-tenancy and data scoping

#### 3. **Financial System**
- `wallets`: User wallet balances (decimal precision)
- `wallet_transactions`: Transaction history with direction and purpose
- `payment_providers`: External payment provider configuration
- `payments`: Payment records and webhooks
- **Constraints**: Atomic transactions, unique references

#### 4. **Subscription System**
- `plans`: Subscription plans (normal/family, monthly/yearly)
- `subscriptions`: User subscription records with status
- `family_groups`: Family subscription groups
- `family_members`: Family member associations
- **Lifecycle**: PENDING → ACTIVE → EXPIRED/CANCELLED

#### 5. **Service & Utility Entities**
- `services`: Available services (plumbing, electrical, etc.)
- `providers`: Service providers with location and availability
- `provider_photos`: Provider photo galleries
- `provider_reviews`: Provider ratings and reviews
- `utility_providers`: Utility company information
- `utility_accounts`: User utility accounts
- `utility_bills`: Bill records with metadata
- `utility_payments`: Bill payment history

#### 6. **Communication System**
- `conversations`: Chat conversations (direct/group)
- `conversation_participants`: Participant management
- `messages`: Chat messages with types and metadata
- `message_reactions`: Message emoji reactions
- `conversation_reads`: Read receipt tracking

#### 7. **Estate Features**
- `access_codes`: Visitor access codes (time-bounded, usage tracking)
- `lost_found_items`: Lost and found items with images
- `reports`: Issue reporting with SLA tracking
- `alerts`: Estate-wide alerts and announcements
- `device_tokens`: FCM device registration
- `user_deleted_alerts`: Alert deletion tracking
- `resident_id`: QR-based resident identification (if not separate)

#### 8. **Bank Service Charges**
- `bank_service_charges`: Estate service charges
- `bank_service_charge_files`: Service charge files

### Database Conventions
- **Primary Keys**: UUID (`uuid_generate_v4()`)
- **Timestamps**: `created_at`, `updated_at` (automatic)
- **Soft Deletes**: Use status flags where applicable
- **Foreign Keys**: CASCADE on delete for hierarchical data
- **Constraints**: Unique constraints on critical fields

### Migration Strategy
- **TypeORM Migrations**: Version-controlled schema changes
- **Initial Migration**: `1700000000000-InitialMigration.ts`
- **Auto-run**: `migrationsRun: true` in production
- **Schema Synchronization**: Disabled in production for safety

---

## Module Architecture

### Module Structure
```
src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Root module
├── config/                    # Configuration
│   ├── app.config.ts
│   └── database.config.ts
├── common/                    # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── custom.decorators.ts
│   ├── guards/
│   │   ├── roles.guard.ts
│   │   ├── estate-scoped.guard.ts
│   │   └── rate-limit.guard.ts
│   └── interfaces/
│       └── common.interface.ts
├── database/
│   ├── data-source.ts
│   ├── migrations/
│   └── seeds/
├── entities/                  # TypeORM entities
├── modules/                   # Feature modules
│   ├── auth/
│   ├── users/
│   ├── estates/
│   ├── wallets/
│   └── ... (12 more modules)
└── test/                      # E2E tests
```

### Module Responsibilities

#### 1. **Auth Module** (`modules/auth/`)
**Purpose**: Authentication and authorization
**Components**:
- `auth.controller.ts`: Login, register, password reset
- `auth.service.ts`: JWT generation, validation
- `jwt.strategy.ts`: Passport JWT strategy
- `local.strategy.ts`: Passport local strategy
- `auth.guards.ts`: Authentication guards

**Endpoints**:
```
POST /auth/register              # User registration
POST /auth/login                 # User login
POST /auth/refresh               # Refresh token
POST /auth/change-password       # Password change
POST /auth/request-password-reset
POST /auth/reset-password
```

#### 2. **Users Module** (`modules/users/`)
**Purpose**: User management and profiles
**Components**:
- `users.controller.ts`: Profile CRUD
- `users.service.ts`: Business logic
- **Entity**: User, UserProfile

**Endpoints**:
```
GET  /users/me                  # Get current user
PUT  /users/me/profile           # Update profile
POST /users/me/devices          # Register device
GET  /users/:id                 # Get user by ID
```

#### 3. **Wallets Module** (`modules/wallets/`)
**Purpose**: In-app wallet system
**Components**:
- `wallets.controller.ts`: Wallet operations
- `wallets.service.ts`: Transaction logic
- **Entity**: Wallet, WalletTransaction

**Endpoints**:
```
GET  /wallets/me                          # Get wallet
POST /wallets/topup                        # Top-up wallet
POST /wallets/transfer                    # Transfer to user
GET  /wallets/me/transactions             # Transaction history
```

**Key Features**:
- Atomic transactions (BEGIN/COMMIT)
- Unique transaction references
- Balance validation
- Transaction direction (CREDIT/DEBIT)
- Purpose tracking (TOP_UP, TRANSFER, PAYMENT)

#### 4. **Subscriptions Module** (`modules/subscriptions/`)
**Purpose**: Subscription and family management
**Components**:
- `subscriptions.controller.ts`: Plan management
- `subscriptions.service.ts`: Family logic
- **Entity**: Plan, Subscription, FamilyGroup, FamilyMember

**Endpoints**:
```
GET  /subscriptions/plans                  # Get plans
POST /subscriptions/activate              # Activate subscription
PUT  /subscriptions/renew                 # Renew subscription
POST /subscriptions/family/members        # Add family member
GET  /subscriptions/me                    # Get my subscription
```

**Family Group Logic**:
- Head user creation only
- Max 5 members per group
- Member invitation and removal
- Head verification

#### 5. **Messaging Module** (`modules/messaging/`)
**Purpose**: Real-time messaging with WebSocket
**Components**:
- `messaging.controller.ts`: REST endpoints
- `messaging.service.ts`: Message handling
- `messaging.gateway.ts`: WebSocket gateway
- **Entity**: Conversation, Message, ConversationParticipant, MessageReaction

**Endpoints**:
```
POST /messaging/conversations             # Create conversation
GET  /messaging/conversations             # Get conversations
POST /messaging/conversations/:id/messages # Send message
GET  /messaging/conversations/:id/messages # Get messages
POST /messaging/estate/:estateId/broadcast # Estate broadcast
```

**WebSocket Events**:
```typescript
join_estate_group           # Join estate room
leave_estate_group          # Leave estate room
send_message                 # Send message
typing                       # Typing indicator
mark_as_read                 # Mark messages as read
estate_broadcast             # Broadcast to estate
```

#### 6. **Utility Bills Module** (`modules/utility-bills/`)
**Purpose**: Utility bill management with Lenco integration
**Components**:
- `utility-bills.controller.ts`: Bill operations
- `utility-bills.service.ts`: Lenco API integration
- **Entity**: UtilityProvider, UtilityAccount, UtilityBill, UtilityPayment

**Endpoints**:
```
POST /utility-bills/lenco/sync-vendors    # Sync vendors
POST /utility-bills/lenco/validate-customer # Validate customer
POST /utility-bills/bills/:id/pay         # Pay bill
GET  /utility-bills/lenco/payment-history
```

#### 7. **Notifications Module** (`modules/notifications/`)
**Purpose**: Push notification management
**Components**:
- `notifications.controller.ts`: Notification endpoints
- `notifications.service.ts`: Firebase integration
- **Entity**: DeviceToken

**Endpoints**:
```
POST /notifications/send/user/:userId      # Send to user
POST /notifications/send/estate/:estateId  # Send to estate
POST /notifications/subscribe/topic        # Subscribe to topic
```

#### 8. **Access Codes Module** (`modules/access-codes/`)
**Purpose**: Visitor access code management
**Components**:
- `access-codes.controller.ts`: Code CRUD
- `access-codes.service.ts`: Validation logic
- **Entity**: AccessCode

**Endpoints**:
```
POST   /access-codes                       # Create code
GET    /access-codes                       # Get my codes
POST   /access-codes/validate/:code        # Validate code
PUT    /access-codes/:code/deactivate     # Deactivate code
```

**Features**:
- Time-bounded validity
- Usage tracking
- Max uses limit
- Notify on use
- Estate scoping

#### 9. **Other Modules**
- **Estates Module**: Estate CRUD operations
- **Lost & Found Module**: Lost item management
- **Service Directory Module**: Service provider management
- **Reports Module**: Issue reporting system
- **Resident ID Module**: QR-based identification
- **Payments Module**: External payment processing
- **Bank Service Charges Module**: Service charge management
- **Alerts Module**: Estate alert management

---

## API Design Patterns

### RESTful Conventions
```typescript
// Resource naming
GET    /resource              # List resources
GET    /resource/:id          # Get single resource
POST   /resource              # Create resource
PUT    /resource/:id          # Update resource
DELETE /resource/:id          # Delete resource

// Nested resources
GET    /resource/:id/subresource
POST   /resource/:id/subresource

// Actions
POST   /resource/:id/action
PUT    /resource/:id/status
```

### Request/Response Patterns

#### Success Response
```typescript
{
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

#### Error Response
```typescript
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

#### Pagination
```typescript
{
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Validation Pattern
```typescript
// Using Zod schemas
const schema = z.object({
  field1: z.string().min(3),
  field2: z.number().positive(),
});

// Controller validation
const parsed = schema.parse(request.body);
```

### Guard Application
```typescript
@UseGuards(AuthGuard('jwt'))
@UseGuards(RolesGuard)
@UseGuards(EstateScopedGuard)
@Roles(UserRole.ADMIN)
@EstateScoped()
@Post('endpoint')
```

### DTO Pattern
```typescript
// Request DTO
interface CreateResourceDto {
  field1: string;
  field2: number;
}

// Response DTO
interface ResourceResponseDto {
  id: string;
  field1: string;
  createdAt: Date;
}
```

---

## Security Architecture

### Authentication Flow
```
1. Login Request
   ↓
2. Credential Validation
   ↓
3. JWT Token Generation (access + refresh)
   ↓
4. Token Response
   ↓
5. Token Storage (client)
   ↓
6. Token in Header (subsequent requests)
   ↓
7. JWT Strategy Validation
   ↓
8. User Context Injection
```

### Token Structure
```typescript
// Access Token (15min expiration)
{
  sub: user_id,
  email: user.email,
  role: user.role,
  estate_id: user.estate_id
}

// Refresh Token (7 days expiration)
{
  sub: user_id,
  type: 'refresh'
}
```

### Authorization Layers
```typescript
// 1. Authentication Guard
@UseGuards(AuthGuard('jwt'))
// Validates JWT token, extracts user

// 2. Role Guard
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
// Checks user role

// 3. Estate Guard
@UseGuards(EstateScopedGuard)
@EstateScoped()
// Validates estate access
```

### Security Features

#### 1. Password Security
```typescript
// bcrypt hashing with configurable rounds
bcrypt.hash(password, rounds)
bcrypt.compare(plain, hash)
```

#### 2. Rate Limiting
```typescript
@UseGuards(RateLimitGuard)
@RateLimit(10, 60) // 10 requests per 60 seconds
```

#### 3. Input Sanitization
```typescript
// Zod schema validation
ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true
})
```

#### 4. CORS Configuration
```typescript
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});
```

#### 5. SQL Injection Prevention
- TypeORM query builder (parameterized queries)
- No raw SQL strings
- Entity-based operations

---

## Data Flow & Integration

### External Integrations

#### 1. **Paystack Integration**
```typescript
// Payment flow
POST /payments/initiate
  → Create payment record
  → Call Paystack API
  → Return authorization URL
  →
POST /payments/webhook/paystack
  → Verify payment
  → Update payment status
  → Update wallet balance
```

#### 2. **Firebase Cloud Messaging**
```typescript
// Notification flow
POST /notifications/send/user/:userId
  → Get user device tokens
  → Create notification payload
  → Send via FCM
  → Track results
  → Clean up inactive tokens
```

#### 3. **Lenco Utility Bill Payment**
```typescript
// Utility payment flow
POST /utility-bills/lenco/products
  → Get available vendors
  →
POST /utility-bills/bills/:id/pay
  → Validate customer
  → Initiate payment
  → Track payment status
```

#### 4. **AWS S3/Linode Object Storage**
```typescript
// File upload flow
POST /upload
  → Validate file
  → Upload to S3
  → Store URL in database
  → Return file URL
```

### Internal Data Flow

#### Wallet Transaction Flow
```typescript
1. Top-up Request
   ↓
2. Create Payment Record
   ↓
3. External Payment Processing
   ↓
4. Webhook Notification
   ↓
5. Verify Payment
   ↓
6. Atomic Wallet Transaction
   ↓
7. Update Balance
   ↓
8. Transaction History
```

#### Subscription Activation Flow
```typescript
1. Activate Subscription Request
   ↓
2. Create Family Group (if family plan)
   ↓
3. Create Subscription Record
   ↓
4. Payment Processing
   ↓
5. Update User Profile
   ↓
6. Set Expiry Date
   ↓
7. Return Subscription
```

---

## Error Handling & Logging

### Error Types
```typescript
// HTTP Exceptions
BadRequestException()       // 400
UnauthorizedException()     // 401
ForbiddenException()       // 403
NotFoundException()        // 404
ConflictException()        // 409
InternalServerErrorException() // 500
```

### Global Exception Filter
```typescript
@Catch()
export class AllExceptionsFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log error
    // Format response
    // Return appropriate status
  }
}
```

### Logging Levels
```typescript
Logger.log()      // Info
Logger.warn()      // Warning
Logger.error()     // Error
Logger.debug()     // Debug
```

### Structured Logging
```typescript
logger.log({
  timestamp: new Date(),
  level: 'error',
  message: 'Error message',
  context: 'ServiceName',
  trace: stackTrace
});
```

---

## Testing Strategy

### Test Types

#### 1. **Unit Tests**
```bash
npm run test
```
- Service logic testing
- Repository testing
- Guard testing

#### 2. **Integration Tests**
- API endpoint testing
- Database interaction testing
- Authentication flow testing

#### 3. **E2E Tests**
```bash
npm run test:e2e
```
- Complete user flows
- Multi-module interaction
- Real database testing

### Test Coverage
```
Authentication Module      ✅
User Management            ✅
Wallet Operations         ✅
Subscription Management   ✅
Access Code Validation    ✅
Messaging Functionality   ✅
```

---

## Deployment Architecture

### Docker Setup
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=vaultify_db
      - POSTGRES_USER=vaultify_user
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Environment Configuration
```typescript
// Production vs Development
NODE_ENV=production       // Disable sync, enable migrations
NODE_ENV=development       // Enable sync, detailed logging

// Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=vaultify_db

// JWT Secrets (MUST be unique in production)
JWT_SECRET=...
JWT_REFRESH_SECRET=...

// External Services
AWS_S3_BUCKET=...
FIREBASE_PROJECT_ID=...
PAYSTACK_SECRET_KEY=...
```

### Scaling Considerations
```
Horizontal Scaling:
  - Load balancer → Multiple app instances
  - Session management (stateless JWT)
  - Database connection pooling

Vertical Scaling:
  - Increased container resources
  - Optimize database queries
  - Cache frequently accessed data
```

---

## Performance Optimization

### Database Optimization
- Indexes on foreign keys
- Indexes on frequently queried fields
- Query optimization (JOIN vs subquery)
- Connection pooling

### API Optimization
- Response compression
- Pagination for large datasets
- Caching for static data
- Batch operations where possible

### Monitoring
- Request/response logging
- Database query logging
- Error tracking
- Performance metrics

---

## Conclusion

Vaultify Backend is a production-ready, scalable estate management platform with:
- **Complete feature set** from ERD implementation
- **Secure authentication** with JWT
- **Real-time communication** with WebSockets
- **Payment integration** with Paystack
- **Push notifications** with Firebase
- **Proper architecture** with clean code principles
- **Comprehensive testing** strategy
- **Production deployment** ready

The system is designed for scalability, maintainability, and security, following NestJS best practices and enterprise-level patterns.

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Production Ready ✅


