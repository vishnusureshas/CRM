import prisma from './src/config/db.js';
let login = await fetch('http://localhost:5000/api/v1/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'admin@crm.local', password:'Password@123'}) }).then(r=>r.json());
let token = login.data.accessToken;
let lead = await prisma.lead.findFirst({ where:{ organizationId: login.data.organization.id } });
console.log('=== Validation Tests ===');

// 1. Invalid mime
let r1 = await fetch('http://localhost:5000/api/v1/attachments/presign', {
  method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
  body: JSON.stringify({ originalName:'bad.exe', mimeType:'application/x-msdownload', size:1024, entityType:'LEAD', entityId: lead.id })
});
console.log('1. Invalid mime should 400:', r1.status, (await r1.json()).message.slice(0,60));

// 2. Too large
let r2 = await fetch('http://localhost:5000/api/v1/attachments/presign', {
  method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
  body: JSON.stringify({ originalName:'big.pdf', mimeType:'application/pdf', size: 15*1024*1024, entityType:'LEAD', entityId: lead.id })
});
console.log('2. Too large should 400/422:', r2.status, (await r2.json()).message.slice(0,60));

// 3. Invalid entityId (not in org)
let r3 = await fetch('http://localhost:5000/api/v1/attachments/presign', {
  method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
  body: JSON.stringify({ originalName:'test.pdf', mimeType:'application/pdf', size:1024, entityType:'LEAD', entityId:'cl0000000000000000000000' })
});
console.log('3. Invalid entity should 404:', r3.status, (await r3.json()).message.slice(0,60));

// 4. Valid with different entity types
for (let t of ['CONTACT','COMPANY','DEAL']) {
  let entity = null;
  if (t==='CONTACT') entity = await prisma.contact.findFirst({where:{organizationId: login.data.organization.id}});
  if (t==='COMPANY') entity = await prisma.company.findFirst({where:{organizationId: login.data.organization.id}});
  if (t==='DEAL') entity = await prisma.deal.findFirst({where:{organizationId: login.data.organization.id}});
  if (!entity) { console.log(`4.${t} no entity skip`); continue; }
  let r = await fetch('http://localhost:5000/api/v1/attachments/presign', {
    method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
    body: JSON.stringify({ originalName:`test-${t}.pdf`, mimeType:'application/pdf', size:1024, entityType:t, entityId: entity.id })
  });
  let j = await r.json();
  console.log(`4.${t} presign`, r.status, j.success ? j.data.storageKey.slice(0,50) : j.message);
  if (j.success) {
    let c = await fetch('http://localhost:5000/api/v1/attachments/confirm', {
      method:'POST', headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
      body: JSON.stringify({ storageKey: j.data.storageKey, originalName:`test-${t}.pdf`, mimeType:'application/pdf', size:1024, entityType:t, entityId: entity.id })
    });
    let cj = await c.json();
    console.log(`  confirm ${t}`, c.status, cj.success ? cj.data.id : cj.message);
    // cleanup
    if (cj.success) await prisma.attachment.delete({where:{id:cj.data.id}});
  }
}

// 5. Check indexes exist
let indexes = await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE tablename='Attachment'`;
console.log('5. Indexes:', indexes.map(i=>i.indexname));

// 6. List after confirm still shows
let list = await fetch('http://localhost:5000/api/v1/attachments', { headers:{'Authorization':`Bearer ${token}`} }).then(r=>r.json());
console.log('6. List after tests', list.data.length, 'items');

// Cleanup test attachment from previous test
let prev = await prisma.attachment.findFirst({where:{originalName:'test-report.pdf'}});
if (prev) { await prisma.attachment.delete({where:{id:prev.id}}); console.log('cleaned test-report.pdf', prev.id); }

await prisma.$disconnect();
console.log('\n=== All validation tests done ===');
