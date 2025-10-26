import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("user_id")
      )
    `);

    // Create estates table
    await queryRunner.query(`
      CREATE TABLE "estates" (
        "estate_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "address" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_estates" PRIMARY KEY ("estate_id")
      )
    `);

    // Create user_profiles table
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "user_id" uuid NOT NULL,
        "phone_number" character varying,
        "role" character varying NOT NULL DEFAULT 'Residence',
        "apartment_type" character varying,
        "house_address" character varying,
        "plan" character varying,
        "subscription_start_date" TIMESTAMP,
        "subscription_expiry_date" TIMESTAMP,
        "profile_picture_url" character varying,
        "last_transaction_reference" character varying,
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("user_id")
      )
    `);

    // Create wallets table
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "wallet_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "available_balance" numeric(10,2) NOT NULL DEFAULT '0',
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("wallet_id")
      )
    `);

    // Create wallet_transactions table
    await queryRunner.query(`
      CREATE TABLE "wallet_transactions" (
        "wallet_txn_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "wallet_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "direction" character varying NOT NULL,
        "purpose" character varying NOT NULL,
        "reference" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wallet_transactions_reference" UNIQUE ("reference"),
        CONSTRAINT "PK_wallet_transactions" PRIMARY KEY ("wallet_txn_id")
      )
    `);

    // Create payment_providers table
    await queryRunner.query(`
      CREATE TABLE "payment_providers" (
        "provider_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "metadata" jsonb,
        CONSTRAINT "PK_payment_providers" PRIMARY KEY ("provider_id")
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "payment_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        "provider_id" uuid NOT NULL,
        "reference" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "paid_at" TIMESTAMP,
        "raw_payload" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payments_reference" UNIQUE ("reference"),
        CONSTRAINT "PK_payments" PRIMARY KEY ("payment_id")
      )
    `);

    // Create plans table
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "plan_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "price_ngn" numeric(10,2) NOT NULL,
        "billing_cycle" character varying NOT NULL,
        "max_members" integer NOT NULL DEFAULT '1',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plans_code" UNIQUE ("code"),
        CONSTRAINT "PK_plans" PRIMARY KEY ("plan_id")
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "subscription_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "start_date" TIMESTAMP NOT NULL,
        "end_date" TIMESTAMP NOT NULL,
        "last_renewal_payment_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("subscription_id")
      )
    `);

    // Create family_groups table
    await queryRunner.query(`
      CREATE TABLE "family_groups" (
        "family_group_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "head_user_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_family_groups" PRIMARY KEY ("family_group_id")
      )
    `);

    // Create family_members table
    await queryRunner.query(`
      CREATE TABLE "family_members" (
        "family_member_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "family_group_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "added_by_user_id" uuid NOT NULL,
        "is_head" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_family_members" PRIMARY KEY ("family_member_id")
      )
    `);

    // Create device_tokens table
    await queryRunner.query(`
      CREATE TABLE "device_tokens" (
        "device_token_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" character varying NOT NULL,
        "platform" character varying NOT NULL,
        "device_id" character varying,
        "last_seen" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("device_token_id")
      )
    `);

    // Create access_codes table
    await queryRunner.query(`
      CREATE TABLE "access_codes" (
        "code" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "creator_user_id" uuid NOT NULL,
        "visitor_name" character varying NOT NULL,
        "visitor_email" character varying,
        "visitor_phone" character varying,
        "valid_from" TIMESTAMP NOT NULL,
        "valid_to" TIMESTAMP NOT NULL,
        "max_uses" integer NOT NULL DEFAULT '1',
        "current_uses" integer NOT NULL DEFAULT '0',
        "gate" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "notify_on_use" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_access_codes_code" UNIQUE ("code"),
        CONSTRAINT "PK_access_codes" PRIMARY KEY ("code")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_profiles" 
      ADD CONSTRAINT "FK_user_profiles_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "wallets" 
      ADD CONSTRAINT "FK_wallets_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "wallet_transactions" 
      ADD CONSTRAINT "FK_wallet_transactions_wallet_id" 
      FOREIGN KEY ("wallet_id") REFERENCES "wallets"("wallet_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "FK_payments_provider_id" 
      FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("provider_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_plan_id" 
      FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_payment_id" 
      FOREIGN KEY ("last_renewal_payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "family_groups" 
      ADD CONSTRAINT "FK_family_groups_head_user_id" 
      FOREIGN KEY ("head_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "family_groups" 
      ADD CONSTRAINT "FK_family_groups_plan_id" 
      FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "family_members" 
      ADD CONSTRAINT "FK_family_members_family_group_id" 
      FOREIGN KEY ("family_group_id") REFERENCES "family_groups"("family_group_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "family_members" 
      ADD CONSTRAINT "FK_family_members_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "family_members" 
      ADD CONSTRAINT "FK_family_members_added_by_user_id" 
      FOREIGN KEY ("added_by_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "device_tokens" 
      ADD CONSTRAINT "FK_device_tokens_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "access_codes" 
      ADD CONSTRAINT "FK_access_codes_creator_user_id" 
      FOREIGN KEY ("creator_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "access_codes" DROP CONSTRAINT "FK_access_codes_creator_user_id"`);
    await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_device_tokens_user_id"`);
    await queryRunner.query(`ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_added_by_user_id"`);
    await queryRunner.query(`ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_user_id"`);
    await queryRunner.query(`ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_family_group_id"`);
    await queryRunner.query(`ALTER TABLE "family_groups" DROP CONSTRAINT "FK_family_groups_plan_id"`);
    await queryRunner.query(`ALTER TABLE "family_groups" DROP CONSTRAINT "FK_family_groups_head_user_id"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_payment_id"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_plan_id"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_user_id"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_provider_id"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_user_id"`);
    await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_wallet_id"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_wallets_user_id"`);
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "access_codes"`);
    await queryRunner.query(`DROP TABLE "device_tokens"`);
    await queryRunner.query(`DROP TABLE "family_members"`);
    await queryRunner.query(`DROP TABLE "family_groups"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "payment_providers"`);
    await queryRunner.query(`DROP TABLE "wallet_transactions"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "estates"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
