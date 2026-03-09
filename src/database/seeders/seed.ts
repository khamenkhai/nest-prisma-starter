import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { AuthSeeder } from './auth.seeder';

async function runSeeders() {
    console.log('🌱 Starting database seeding...');
    const app = await NestFactory.createApplicationContext(SeederModule);

    try {

        const authSeeder = app.get(AuthSeeder);

        console.log(
            '📝 Seeding authentication data (roles, permissions, users)...',
        );
        await authSeeder.seed();
        console.log('✅ Authentication seeding completed');

        console.log('🎉 All seeders completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

runSeeders().catch((error) => {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
});
