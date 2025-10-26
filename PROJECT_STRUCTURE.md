# Vaultify Backend - Project Structure

## 📁 Project Overview

This is a comprehensive NestJS backend implementation for the Vaultify estate management platform, built according to the provided ERD and specifications.

## 🏗️ Architecture

### Core Modules Implemented

1. **Authentication Module** (`src/modules/auth/`)
   - JWT-based authentication with access/refresh tokens
   - Password hashing with bcrypt
   - User registration, login, password reset
   - Role-based access control

2. **Users Module** (`src/modules/users/`)
   - User profile management
   - Device token registration for push notifications
   - User search and management
   - Estate-scoped user operations

3. **Estates Module** (`src/modules/estates/`)
   - Estate management and CRUD operations
   - Estate search functionality
   - Admin-only estate operations

4. **Wallets Module** (`src/modules/wallets/`)
   - In-app wallet system
   - Wallet transactions (credit/debit)
   - Wallet top-up via external payments
   - User-to-user transfers
   - Transaction history with filtering

5. **Payments Module** (`src/modules/payments/`)
   - External payment processing
   - Paystack integration
   - Payment verification and webhooks
   - Payment history tracking

6. **Subscriptions Module** (`src/modules/subscriptions/`)
   - Normal and family subscription plans
   - Subscription activation and renewal
   - Family group management
   - Payment method integration (wallet/external)

7. **Access Codes Module** (`src/modules/access-codes/`)
   - Time-bounded visitor access codes
   - Usage tracking and validation
   - Code generation and management

## 🗄️ Database Entities

### Core Entities
- **User**: User accounts with authentication
- **UserProfile**: Extended user information and roles
- **Estate**: Estate management and scoping
- **Wallet**: In-app wallet system
- **WalletTransaction**: Wallet transaction history
- **Payment**: External payment records
- **PaymentProvider**: Payment provider configuration

### Subscription Entities
- **Plan**: Subscription plans (normal/family)
- **Subscription**: User subscription records
- **FamilyGroup**: Family subscription groups
- **FamilyMember**: Family group membership

### Additional Entities
- **DeviceToken**: FCM device tokens
- **AccessCode**: Visitor access codes
- **Alert**: System alerts and notifications
- **UserDeletedAlert**: User-specific alert dismissals
- **LostFoundItem**: Lost and found items
- **BankServiceCharge**: Bank service charges
- **BankServiceChargeFile**: Service charge receipts

### Service Directory Entities
- **Service**: Available services
- **Provider**: Service providers
- **ProviderPhoto**: Provider photos
- **ProviderReview**: Provider reviews

### Utility Entities
- **UtilityProvider**: Utility companies
- **UtilityAccount**: User utility accounts
- **UtilityBill**: Utility bills
- **UtilityPayment**: Bill payments

### Messaging Entities
- **Conversation**: Chat conversations
- **ConversationParticipant**: Conversation membership
- **Message**: Chat messages
- **MessageReaction**: Message reactions

### Reporting Entities
- **Report**: Resident issue reports

## 🔧 Key Features Implemented

### Authentication & Security
- JWT access/refresh token system
- Role-based access control (Admin, Security Personnel, Residence)
- Password hashing with configurable bcrypt rounds
- Rate limiting for sensitive endpoints
- Estate-scoped data access

### Wallet System
- Atomic wallet transactions
- Optimistic concurrency control
- Multiple payment methods (Paystack, Card, Transfer)
- Transaction history with filtering
- User-to-user transfers

### Subscription Management
- Normal and family subscription plans
- Automatic renewal processing
- Family group management
- Payment integration (wallet/external)

### Access Control
- Time-bounded visitor access codes
- Usage tracking and limits
- Estate-scoped access validation

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/change-password` - Password change
- `POST /auth/request-password-reset` - Password reset request
- `POST /auth/reset-password` - Password reset with OTP

### User Management
- `GET /users/me` - Get current user
- `PUT /users/me/profile` - Update profile
- `POST /users/me/devices` - Register device
- `DELETE /users/me/devices/:token` - Unregister device
- `GET /users/search` - Search users
- `GET /users/:id` - Get user by ID

### Wallet Operations
- `GET /wallets/me` - Get wallet balance
- `GET /wallets/me/transactions` - Transaction history
- `POST /wallets/topup` - Top up wallet
- `POST /wallets/transfer` - Transfer money

### Subscriptions
- `GET /subscriptions/plans` - Available plans
- `GET /subscriptions/me` - User subscriptions
- `GET /subscriptions/me/active` - Active subscription
- `POST /subscriptions/activate` - Activate subscription
- `PUT /subscriptions/renew` - Renew subscription
- `PUT /subscriptions/cancel` - Cancel subscription
- `GET /subscriptions/family/group` - Family group
- `POST /subscriptions/family/members` - Add family member
- `DELETE /subscriptions/family/members` - Remove family member

### Access Codes
- `POST /access-codes` - Create access code
- `GET /access-codes` - Get user's codes
- `POST /access-codes/validate/:code` - Validate code
- `PUT /access-codes/:code/deactivate` - Deactivate code

### Payments
- `POST /payments/initiate` - Initiate payment
- `GET /payments/verify/:reference` - Verify payment
- `POST /payments/webhook/paystack` - Paystack webhook
- `GET /payments/history` - Payment history
- `GET /payments/:id` - Get payment details

## 🛠️ Configuration

### Environment Variables
- Database configuration (PostgreSQL)
- JWT secrets and expiration times
- AWS S3 credentials (Linode Object Storage)
- Firebase configuration
- Paystack API keys
- Email SMTP settings
- Rate limiting configuration

### Database Migrations
- Initial migration with all tables
- Foreign key constraints
- Indexes for performance
- Seed data for initial setup

## 🧪 Testing

### Test Structure
- Unit tests for services
- Integration tests for modules
- E2E tests for critical flows
- Jest configuration for TypeScript

### Test Coverage
- Authentication flows
- User management
- Wallet operations
- Subscription management
- Access code validation

## 🚀 Deployment

### Docker Support
- Dockerfile for containerization
- Docker Compose for local development
- Environment variable configuration
- PostgreSQL database container

### Production Considerations
- Environment-specific configurations
- Database connection pooling
- Error handling and logging
- Security headers and CORS
- Rate limiting and validation

## 📚 Documentation

### API Documentation
- Swagger/OpenAPI integration
- Comprehensive endpoint documentation
- Request/response schemas
- Authentication examples

### Code Documentation
- TypeScript interfaces and types
- Service method documentation
- Entity relationship documentation
- Configuration examples

## 🔄 Future Enhancements

### Planned Features
- Complete messaging system implementation
- Resident ID QR code generation
- Report management system
- FCM notification service
- File upload and media management
- Advanced search and filtering
- Audit logging and monitoring

### Scalability Considerations
- Database indexing optimization
- Caching layer implementation
- Microservices architecture
- Load balancing configuration
- Monitoring and alerting

## 📝 Notes

This implementation provides a solid foundation for the Vaultify estate management platform with all core features from the ERD implemented. The codebase follows NestJS best practices with proper separation of concerns, comprehensive error handling, and security considerations.

The modular architecture allows for easy extension and maintenance, while the comprehensive test suite ensures reliability and stability.
