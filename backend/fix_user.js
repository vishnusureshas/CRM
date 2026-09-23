import prisma from './src/config/db.js';
import bcrypt from 'bcrypt';
let email='jishnuaswin@gmail.com';
let hash=await bcrypt.hash('Password@123',10);
let user=await prisma.user.findUnique({where:{email}});
console.log('user', user?.id, user?.email);
if(user){
  await prisma.user.update({where:{id:user.id}, data:{password:hash}});
  console.log('password reset to Password@123');
}
await prisma.$disconnect();
