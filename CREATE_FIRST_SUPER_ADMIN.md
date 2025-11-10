# How to Create the First Super Admin

Since you need a Super Admin to create other Super Admins, here are several ways to bootstrap the first one:

---

## Option 1: Direct SQL Update (Quickest) ⚡

If you have an existing admin user (from seed or manually created), update it directly:

### Step 1: Connect to PostgreSQL
```bash
docker-compose exec postgres psql -U vaultify_user -d vaultify_db
```

### Step 2: Find the Admin User
```sql
SELECT user_id, email, first_name, last_name 
FROM users 
WHERE email = 'admin@vaultify.com';
```

### Step 3: Update to Super Admin
```sql
UPDATE user_profiles 
SET role = 'Super Admin' 
WHERE user_id = (SELECT user_id FROM users WHERE email = 'admin@vaultify.com');
```

### Step 4: Verify
```sql
SELECT u.email, up.role 
FROM users u 
JOIN user_profiles up ON u.user_id = up.user_id 
WHERE u.email = 'admin@vaultify.com';
```

### Step 5: Exit
```sql
\q
```

---

## Option 2: Create New User and Update via SQL

### Step 1: Register a New User
```json
POST http://localhost:3000/auth/register
{
  "email": "superadmin@vaultify.com",
  "password": "superadmin123",
  "first_name": "Super",
  "last_name": "Admin",
  "estate_id": "{{estate_id}}"
}
```

### Step 2: Verify OTP
```json
POST http://localhost:3000/auth/verify-otp
{
  "user_id": "{{user_id}}",
  "otp": "123456"
}
```

### Step 3: Activate User (if you have an admin)
```json
PUT http://localhost:3000/users/{{user_id}}/activate
Authorization: Bearer {{admin_token}}
```

### Step 4: Update to Super Admin via SQL
```bash
docker-compose exec postgres psql -U vaultify_user -d vaultify_db -c "
UPDATE user_profiles 
SET role = 'Super Admin', estate_id = NULL 
WHERE user_id = '{{user_id}}';
"
```

---

## Option 3: One-Line SQL Command

If you know the user_id, you can do it in one command:

```bash
docker-compose exec postgres psql -U vaultify_user -d vaultify_db -c "UPDATE user_profiles SET role = 'Super Admin', estate_id = NULL WHERE user_id = (SELECT user_id FROM users WHERE email = 'admin@vaultify.com');"
```

---

## Option 4: Update Seed File (For Future Deployments)

I've already updated the seed file to create a SUPER_ADMIN. After running seeds:

**Credentials:**
- Email: `admin@vaultify.com`
- Password: `admin123`
- Role: `Super Admin`

**To run seeds manually:**
```bash
# Connect to container
docker-compose exec app sh

# Run seeds (Note: seeds might not work with current TypeORM setup)
npm run seed:run
```

---

## Option 5: Create Bootstrap Script

Create a simple script to bootstrap the first super admin:

```typescript
// bootstrap-super-admin.ts
import { DataSource } from 'typeorm';
import { DatabaseConfig } from '../config/database.config';
import { User, UserStatus } from '../entities/user.entity';
import { UserProfile, UserRole } from '../entities/user-profile.entity';
import { Wallet } from '../entities/wallet.entity';
import * as bcrypt from 'bcryptjs';

async function bootstrapSuperAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    ...DatabaseConfig(),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const profileRepo = dataSource.getRepository(UserProfile);
  const walletRepo = dataSource.getRepository(Wallet);

  // Check if super admin exists
  const existing = await userRepo.findOne({
    where: { email: 'superadmin@vaultify.com' },
    relations: ['profile'],
  });

  if (existing) {
    console.log('Super admin already exists!');
    await dataSource.destroy();
    return;
  }

  // Create super admin
  const hashedPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = userRepo.create({
    email: 'superadmin@vaultify.com',
    password_hash: hashedPassword,
    first_name: 'Super',
    last_name: 'Admin',
    status: UserStatus.ACTIVE,
  });

  const savedUser = await userRepo.save(superAdmin);

  // Create super admin profile
  const profile = profileRepo.create({
    user_id: savedUser.user_id,
    role: UserRole.SUPER_ADMIN,
    phone_number: '+2348000000000',
  });

  await profileRepo.save(profile);

  // Create wallet
  const wallet = walletRepo.create({
    user_id: savedUser.user_id,
    available_balance: 0,
  });

  await walletRepo.save(wallet);

  console.log('✅ Super Admin created successfully!');
  console.log('Email: superadmin@vaultify.com');
  console.log('Password: superadmin123');

  await dataSource.destroy();
}

bootstrapSuperAdmin().catch(console.error);
```

---

## Recommended Approach

**For immediate use:** Use **Option 1** (Direct SQL Update) - it's the fastest and most reliable.

**For production:** Use **Option 4** (Updated Seed File) - the seed file now creates a SUPER_ADMIN by default.

---

## Verify Super Admin

After creating the super admin, verify it works:

```json
POST http://localhost:3000/auth/login
{
  "email": "admin@vaultify.com",
  "password": "admin123"
}
```

Then check the response - the user object should show the role, or you can check:

```json
GET http://localhost:3000/users/me
Authorization: Bearer {{token}}
```

The profile should show `role: "Super Admin"`.

---

## Quick SQL Commands Reference

```bash
# Connect to database
docker-compose exec postgres psql -U vaultify_user -d vaultify_db

# List all users with roles
SELECT u.email, u.status, up.role, up.estate_id 
FROM users u 
LEFT JOIN user_profiles up ON u.user_id = up.user_id;

# Make any user super admin (replace email)
UPDATE user_profiles 
SET role = 'Super Admin', estate_id = NULL 
WHERE user_id = (SELECT user_id FROM users WHERE email = 'your-email@example.com');

# Check if update worked
SELECT u.email, up.role 
FROM users u 
JOIN user_profiles up ON u.user_id = up.user_id 
WHERE u.email = 'your-email@example.com';
```

