import * as bcrypt from 'bcrypt';
import { PrismaClient, UserStatus } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'practice@admin.com';
  const password = 'Qwerty@23';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: 'Admin',
      isAdmin: true,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
    },
    create: {
      email,
      passwordHash,
      name: 'Admin',
      isAdmin: true,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Admin user ready: ${admin.email} (id=${admin.id})`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
