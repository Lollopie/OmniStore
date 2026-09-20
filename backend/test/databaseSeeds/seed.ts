import { SeedingDataSource } from './typeorm.config';
import { seedOrganizations } from './organization.seed';
import { seedWarehouses } from './warehouse.seed';
import { seedInventories } from './inventory.seed';
import { seedUsers } from './user.seed';

async function run() {
  await SeedingDataSource.initialize();
  await seedOrganizations(SeedingDataSource);
  await seedWarehouses(SeedingDataSource);
  await seedInventories(SeedingDataSource);
  await seedUsers(SeedingDataSource);
  await SeedingDataSource.destroy();
  console.log('Database seeding completed successfully.');
}

run().catch((error) => {
  console.error('Error during database seeding:', error);
  process.exit(1);
});
