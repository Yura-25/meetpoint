import { prisma } from './db.js';

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users:', users);
  } catch (err) {
    console.error('Prisma error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
