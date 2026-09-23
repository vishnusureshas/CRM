import prisma from './src/config/db.js';
import bcrypt from 'bcrypt';
let hash=await bcrypt.hash('Password@123',10);
await prisma.user.update({where:{id:'cmu5qufa40001zizg8rbwvjsg'}, data:{password:hash}});
console.log('fixed');
await prisma.$disconnect();
