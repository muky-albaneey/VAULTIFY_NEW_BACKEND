import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAccessCodeColumnType1763439557746 implements MigrationInterface {
    name = 'FixAccessCodeColumnType1763439557746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add new id column as UUID
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ADD COLUMN "id" uuid NOT NULL DEFAULT uuid_generate_v4()
        `);

        // Step 2: Drop the old primary key constraint on code
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            DROP CONSTRAINT "PK_access_codes"
        `);

        // Step 3: Drop the unique constraint on code (we'll recreate it after changing type)
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            DROP CONSTRAINT IF EXISTS "UQ_access_codes_code"
        `);

        // Step 4: Change code column from UUID to VARCHAR(8)
        // For existing data, convert UUID to 8-char uppercase string
        // If there's existing data, we'll generate new codes
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ALTER COLUMN "code" TYPE varchar(8) 
            USING UPPER(SUBSTRING(REPLACE("code"::text, '-', ''), 1, 8))
        `);

        // Step 5: Add primary key constraint on id
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ADD CONSTRAINT "PK_access_codes" PRIMARY KEY ("id")
        `);

        // Step 6: Add unique constraint on code
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ADD CONSTRAINT "UQ_access_codes_code" UNIQUE ("code")
        `);

        // Step 7: Create index on code for faster lookups
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_access_codes_code" ON "access_codes" ("code")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop the index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_access_codes_code"
        `);

        // Step 2: Drop unique constraint on code
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            DROP CONSTRAINT IF EXISTS "UQ_access_codes_code"
        `);

        // Step 3: Drop primary key on id
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            DROP CONSTRAINT IF EXISTS "PK_access_codes"
        `);

        // Step 4: Change code back to UUID (this will fail if codes aren't valid UUIDs)
        // Note: This is a destructive operation as we can't restore original UUIDs
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ALTER COLUMN "code" TYPE uuid USING NULL
        `);

        // Step 5: Add primary key back on code
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ADD CONSTRAINT "PK_access_codes" PRIMARY KEY ("code")
        `);

        // Step 6: Add unique constraint back
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            ADD CONSTRAINT "UQ_access_codes_code" UNIQUE ("code")
        `);

        // Step 7: Drop the id column
        await queryRunner.query(`
            ALTER TABLE "access_codes" 
            DROP COLUMN IF EXISTS "id"
        `);
    }
}

