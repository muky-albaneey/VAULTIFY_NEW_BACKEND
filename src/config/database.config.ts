import { registerAs } from '@nestjs/config';

export const DatabaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'vaultify_user',
  password: process.env.DATABASE_PASSWORD || 'vaultify_password',
  name: process.env.DATABASE_NAME || 'vaultify_db',
}));
