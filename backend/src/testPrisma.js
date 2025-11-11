import { prisma } from './db.js';

const test = async () => {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
};

test()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
  