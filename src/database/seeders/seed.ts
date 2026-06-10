import 'dotenv/config';
import { PrismaClient } from 'src/database/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const permissionNames = [
  'todo.create',
  'todo.read',
  'todo.update',
  'todo.delete',
  'user.create',
  'user.read',
  'user.update',
  'user.delete',
];

async function seed() {
  console.log('🌱 Starting database seeding...');
  const prisma = createPrismaClient();

  try {
    // Seed permissions
    const permissions: any[] = [];
    for (const name of permissionNames) {
      let permission = await prisma.permission.findUnique({
        where: { name },
      });
      if (!permission) {
        permission = await prisma.permission.create({ data: { name } });
      }
      permissions.push(permission);
    }

    // Seed superadmin role
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' },
    });
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: { name: 'superadmin' },
      });
    }

    // Link permissions to role
    for (const permission of permissions) {
      const exists = await prisma.rolePermission.findFirst({
        where: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
      if (!exists) {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    // Seed admin user
    const adminEmail = 'admin@example.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          username: 'System Administrator',
          password: hashedPassword,
          roleId: superAdminRole.id,
        },
      });
      console.log(`👤 Created default user: ${adminEmail}`);
    }

    console.log('✅ Superadmin role and all permissions seeded!');
    console.log('🎉 All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error('❌ Fatal error during seeding:', error);
  process.exit(1);
});
