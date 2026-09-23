import prisma from './src/config/db.js';
let rows = await prisma.$queryRaw`SELECT migration_name, finished_at, applied_steps_count FROM "_prisma_migrations" ORDER BY finished_at`;
console.log(rows);
let tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
console.log('tables', tables.map(t=>t.tablename).join(', '));
let cols = await prisma.$queryRaw`SELECT COUNT(*) as c FROM information_schema.columns WHERE table_name='Attachment'`;
console.log('Attachment cols', cols[0].c);
await prisma.$disconnect();
