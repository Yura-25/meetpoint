import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Łódź Data...');

  // 1. Create a "Guide" User for Łódź
  // We use upsert so if it exists, it doesn't crash
  const password = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'lodz@meetpoint.com' },
    update: {},
    create: {
      email: 'lodz@meetpoint.com',
      name: 'Łódź Guide',
      password,
      // If your User model requires avatar, we provide a default string
      avatar: 'resources/avatars/avatar1.jpg' 
    },
  });

  // 2. Create Dummy Events
  // Note: We use 'date' and 'maxMembers' because we kept your old schema names
  const events = [
    {
      title: 'Manufaktura Coding',
      description: 'Open air coding session near the fountain.',
      category: 'tech',
      latitude: 51.7795,
      longitude: 19.4480,
      address: 'Manufaktura, Łódź',
      date: new Date(Date.now() + 86400000), // Tomorrow
      maxMembers: 5,
      creatorId: user.id
    },
    {
      title: 'Piotrkowska Evening Walk',
      description: 'Walking from Plac Wolności to Central.',
      category: 'social',
      latitude: 51.7600,
      longitude: 19.4570,
      address: 'Piotrkowska 100, Łódź',
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      maxMembers: 10,
      creatorId: user.id
    },
    {
      title: 'Off Piotrkowska Lunch',
      description: 'Trying out the new food trucks.',
      category: 'food',
      latitude: 51.7618,
      longitude: 19.4620,
      address: 'OFF Piotrkowska, Łódź',
      date: new Date(Date.now() + 200000), // very soon
      maxMembers: 8,
      creatorId: user.id
    }
  ];

  // Loop through and create them
  for (const event of events) {
    await prisma.event.create({ data: event });
  }
  
  console.log('✅ Seed complete. Events created in Łódź.');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });