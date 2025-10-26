# 🏠 Vaultify Backend - Complete Estate Management Platform

A comprehensive NestJS backend for the Vaultify estate management platform with JWT authentication, wallet system, subscriptions, utility bills, messaging, and more.

## ✨ Features

### 🔐 **Authentication & Security**
- JWT-based authentication with access/refresh tokens
- Role-based access control (Admin, Security Personnel, Residence)
- Estate-scoped data access
- Password hashing with bcrypt
- Rate limiting for sensitive endpoints
- Input validation with Zod schemas

### 👥 **User Management**
- User registration and authentication
- Profile management with apartment types and roles
- Device token management for push notifications
- Estate management and scoping
- User search and management

### 💰 **Wallet & Payments**
- In-app wallet system with atomic transactions
- Wallet top-up via Paystack integration
- User-to-user transfers
- Transaction history with filtering
- External payment processing
- Payment verification and webhooks

### 📋 **Subscriptions**
- Normal and family subscription plans
- Subscription activation and renewal
- Family group management (up to 5 members)
- Payment integration (wallet/external)
- Plan management with billing cycles

### 🔐 **Access Control**
- Time-bounded visitor access codes
- Usage tracking and validation
- Estate-scoped access validation
- Code generation and management

### 🏠 **Estate Services**
- Lost & Found system with image uploads
- Service directory with providers and reviews
- Provider management with photos and ratings
- Service categories and search functionality

### 💡 **Utility Bills**
- Utility account management
- Bill generation and tracking
- Bill payments via wallet or external
- Payment history and receipts
- Multiple utility providers support

### 📱 **Resident ID System**
- Rotating QR code generation (10-minute rotation)
- JWT-signed tokens with expiration
- Security validation for estate access
- Real-time verification system

### 📊 **Reports & Issues**
- Issue reporting system for residents
- Report management with status tracking
- SLA management and overdue tracking
- Admin assignment and resolution

### 💬 **Private Messaging**
- Estate-scoped conversations
- Direct and group messaging
- Message reactions and replies
- Read receipts and typing indicators
- Media sharing support

### 🔔 **Notifications**
- Firebase Cloud Messaging integration
- Push notifications to users and estates
- Topic subscriptions for targeted messaging
- Device token management

## 🛠️ Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 15 with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI
- **Storage**: AWS S3-compatible (Linode Object Storage)
- **Notifications**: Firebase Cloud Messaging
- **Payments**: Paystack integration
- **QR Codes**: QRCode library
- **Testing**: Jest with E2E tests

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## 🚀 Quick Start

### Option 1: Using Startup Scripts

**Windows:**
```bash
start.bat
```

**Linux/macOS:**
```bash
./start.sh
```

### Option 2: Manual Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd vaultify-backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=vaultify_user
   DATABASE_PASSWORD=vaultify_password
   DATABASE_NAME=vaultify_db

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

   # AWS S3 Configuration (Linode Object Storage)
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=vaultify-media

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=your-firebase-private-key
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email

   # Paystack Configuration
   PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
   PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb vaultify_db

   # Run migrations
   npm run migration:run

   # Seed initial data
   npm run seed:run
   ```

4. **Start the Application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **API Base URL**: http://localhost:3000

## 🗄️ Database Schema

The application uses the following main entities:

### Core Entities
- **Users**: User accounts with authentication
- **UserProfiles**: Extended user information and roles
- **Estates**: Estate management and scoping
- **Wallets**: In-app wallet system
- **WalletTransactions**: Wallet transaction history
- **Payments**: External payment records
- **PaymentProviders**: Payment provider configuration

### Subscription Entities
- **Plans**: Subscription plans (normal/family)
- **Subscriptions**: User subscription records
- **FamilyGroups**: Family subscription groups
- **FamilyMembers**: Family group membership

### Service Entities
- **Services**: Available services
- **Providers**: Service providers
- **ProviderPhotos**: Provider photos
- **ProviderReviews**: Provider reviews

### Utility Entities
- **UtilityProviders**: Utility companies
- **UtilityAccounts**: User utility accounts
- **UtilityBills**: Utility bills
- **UtilityPayments**: Bill payments

### Messaging Entities
- **Conversations**: Chat conversations
- **ConversationParticipants**: Conversation membership
- **Messages**: Chat messages
- **MessageReactions**: Message reactions

### Additional Entities
- **DeviceTokens**: FCM device tokens
- **AccessCodes**: Visitor access codes
- **Reports**: Issue reporting system
- **LostFoundItems**: Lost and found items

## 🔑 Key API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/change-password` - Change password

### User Management
- `GET /users/me` - Get current user profile
- `PUT /users/me/profile` - Update user profile
- `POST /users/me/devices` - Register device for notifications

### Wallet
- `GET /wallets/me` - Get user wallet
- `POST /wallets/topup` - Top up wallet
- `POST /wallets/transfer` - Transfer to another user
- `GET /wallets/me/transactions` - Get transaction history

### Subscriptions
- `GET /subscriptions/plans` - Get available plans
- `POST /subscriptions/activate` - Activate subscription
- `PUT /subscriptions/renew` - Renew subscription
- `POST /subscriptions/family/members` - Add family member

### Access Codes
- `POST /access-codes` - Create access code
- `POST /access-codes/validate/:code` - Validate access code
- `GET /access-codes` - Get user's access codes

### Messaging
- `POST /messaging/conversations` - Create conversation
- `GET /messaging/conversations` - Get user conversations
- `POST /messaging/conversations/:id/messages` - Send message
- `GET /messaging/conversations/:id/messages` - Get messages

### Resident ID
- `POST /resident-id/generate/:estateId` - Generate QR code
- `POST /resident-id/validate/:estateId` - Validate QR code
- `GET /resident-id/status/:estateId` - Get ID status

### Reports
- `POST /reports` - Create report
- `GET /reports/me` - Get user reports
- `PUT /reports/:id/status` - Update report status

### Notifications
- `POST /notifications/send/user/:userId` - Send to user
- `POST /notifications/send/estate/:estateId` - Send to estate
- `POST /notifications/subscribe/topic` - Subscribe to topic

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, Security Personnel, Residence roles
- **Estate Scoping**: Data isolation by estate
- **Rate Limiting**: API rate limiting for sensitive endpoints
- **Input Validation**: Zod schema validation for all inputs
- **Password Hashing**: bcrypt with configurable rounds
- **CORS Configuration**: Configurable cross-origin resource sharing
- **SQL Injection Protection**: TypeORM query builder protection

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Coverage
- Authentication flows
- User management
- Wallet operations
- Subscription management
- Access code validation
- Messaging functionality

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t vaultify-backend .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables
Ensure all required environment variables are set in production:
- Database credentials
- JWT secrets
- AWS S3 credentials
- Firebase credentials
- Paystack credentials

## 📊 Database Migrations

### Running Migrations
```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Seed Data
```bash
# Run seeds
npm run seed:run
```

## 🔧 Development

### Code Quality
```bash
npm run lint
npm run format
```

### Available Scripts
- `npm run start` - Start production server
- `npm run start:dev` - Start development server
- `npm run start:debug` - Start with debugging
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run tests with coverage

## 📈 Monitoring & Logging

- Comprehensive error handling
- Request/response logging
- Database query logging (development)
- Performance monitoring
- Health check endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api/docs`

## 🎯 Project Status

✅ **COMPLETED** - All features from the ERD have been implemented and tested. The backend is production-ready!

---

**Built with ❤️ for Vaultify Estate Management Platform**
