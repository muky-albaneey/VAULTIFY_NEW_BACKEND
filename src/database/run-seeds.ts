import { AppDataSource } from './data-source';
import { SeedData } from './seeds/seed-data';

async function runSeeds() {
  try {
    console.log('🌱 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🌱 Running database seeds...');
    await SeedData.run(AppDataSource);
    console.log('✅ Seeds completed successfully');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

runSeeds();

