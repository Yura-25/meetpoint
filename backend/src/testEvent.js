import { prisma } from './db.js';

async function main() {
  const event = await prisma.event.create({
    data: {
      title: 'Test Event',
      description: 'My first test event',
      authorId: 1,             
      date: new Date()        
    }
  });
  console.log(event);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
