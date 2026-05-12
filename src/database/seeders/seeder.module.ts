import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthSeeder } from 'src/database/seeders/auth.seeder';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  providers: [AuthSeeder],
  exports: [AuthSeeder],
})
export class SeederModule {}
