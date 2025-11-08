import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@/modules/users/users.service';
import { AuthService } from '@/modules/auth/auth.service';
import { EstatesService } from '@/modules/estates/estates.service';
import { AppModule } from '@/app.module';
// import { AppModule } from '../app.module';
// import { AuthService } from '../modules/auth/auth.service';
// import { UsersService } from '../modules/users/users.service';

describe('Vaultify Backend (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let estatesService: EstatesService;
  let testEstateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT) || 5432,
          username: process.env.DATABASE_USERNAME || 'vaultify_user',
          password: process.env.DATABASE_PASSWORD || 'vaultify_password',
          database: process.env.DATABASE_NAME || 'vaultify_test_db',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    estatesService = moduleFixture.get<EstatesService>(EstatesService);

    await app.init();

    // Create a test estate for all tests
    const testEstate = await estatesService.createEstate({
      name: 'Test Estate',
      email: 'test@estate.com',
      address: '123 Test Street',
    });
    testEstateId = testEstate.estate_id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new user and send OTP', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        estate_id: testEstateId,
      };

      const result = await authService.register(registerData);
      
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user_id');
      expect(result.user_id).toBeDefined();
    });

    it('should reject login for pending users', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Please verify your email to login');
    });

    it('should login with valid credentials for active users', async () => {
      // First create a verified user
      const registerData = {
        email: 'activetest@example.com',
        password: 'password123',
        first_name: 'Active',
        last_name: 'Test',
        estate_id: testEstateId,
      };

      const registerResult = await authService.register(registerData);
      
      // Verify OTP (get the OTP from the user - in real scenario, check email)
      // For testing, we'll manually activate the user by getting the OTP from the database
      const testUser = await authService['userRepository'].findOne({ where: { user_id: registerResult.user_id } });
      const otp = testUser.verification_code;
      
      // Verify OTP to activate user
      await authService.verifyOTP(registerResult.user_id, otp);

      // Now login should work
      const loginData = {
        email: 'activetest@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginData);
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe(loginData.email);
      expect(result.user.status).toBe('active');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginData)).rejects.toThrow();
    });
  });

  describe('User Management', () => {
    let userId: string;

    beforeAll(async () => {
      const registerData = {
        email: 'usertest@example.com',
        password: 'password123',
        first_name: 'User',
        last_name: 'Test',
        estate_id: testEstateId,
      };

      const registerResult = await authService.register(registerData);
      userId = registerResult.user_id;
      
      // Activate user by verifying OTP
      const testUser = await authService['userRepository'].findOne({ where: { user_id: userId } });
      await authService.verifyOTP(userId, testUser.verification_code);
    });

    it('should get user profile', async () => {
      const profile = await usersService.getMe(userId);
      
      expect(profile).toHaveProperty('user_id');
      expect(profile).toHaveProperty('email');
      expect(profile.email).toBe('usertest@example.com');
    });

    it('should update user profile', async () => {
      const updateData = {
        phone_number: '+2348000000000',
        house_address: '123 Test Street',
      };

      const updatedProfile = await usersService.updateProfile(userId, updateData);
      
      expect(updatedProfile.phone_number).toBe(updateData.phone_number);
      expect(updatedProfile.house_address).toBe(updateData.house_address);
    });
  });
});
