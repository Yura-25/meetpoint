import { prisma } from './db.js';
import bcrypt from 'bcrypt';

async function main() {
  const hashedPassword = await bcrypt.hash('mypassword', 10);

//poiuygf
  let user = await prisma.user.findUnique({
    where: { email: 'freshuser@example.com' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Fresh User',
        email: 'freshuser@example.com',
        password: hashedPassword
      }
    });
  }

  //lkj
  const event = await prisma.event.create({
    data: {
      title: 'Test Event',
      description: 'My first test event',
      date: new Date(),
      latitude: 50.4501,
      longitude: 30.5234,
      category: 'Meetup',
      creator: {
        connect: { id: user.id }
      }
    }
  });

  console.log({ user, event });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());