import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@/modules/users/users.service';
import { AuthService } from '@/modules/auth/auth.service';
import { AppModule } from '@/app.module';
// import { AppModule } from '../app.module';
// import { AuthService } from '../modules/auth/auth.service';
// import { UsersService } from '../modules/users/users.service';

describe('Vaultify Backend (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const result = await authService.register(registerData);
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe(registerData.email);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginData);
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe(loginData.email);
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
      };

      const result = await authService.register(registerData);
      userId = result.user.user_id;
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
