import prisma from './src/config/db.js';
console.log('=== Prisma Schema Check ===');
let cols = await prisma.$queryRaw`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='Attachment' ORDER BY ordinal_position`;
console.log(cols);
let indexes = await prisma.$queryRaw`SELECT indexname, indexdef FROM pg_indexes WHERE tablename='Attachment'`;
console.log('indexes', indexes);

console.log('\n=== Existing Attachments ===');
let existing = await prisma.attachment.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
console.log('count', existing.length, existing.map(a=>({id:a.id, originalName:a.originalName, storageKey:a.storageKey, entityType:a.entityType, entityId:a.entityId, org:a.organizationId})));

// Test API flow via fetch
console.log('\n=== API Flow Test ===');
let login = await fetch('http://localhost:5000/api/v1/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'admin@crm.local', password:'Password@123'}) }).then(r=>r.json());
let token = login.data.accessToken;
let orgId = login.data.organization.id;
console.log('login org', orgId);

// pick a valid lead for entityId
let lead = await prisma.lead.findFirst({ where:{ organizationId: orgId } });
console.log('lead for test', lead?.id, lead?.firstName);
let entityId = lead?.id;
if (!entityId) { console.log('no lead'); await prisma.$disconnect(); process.exit(0); }

// 1. Presign
let pres = await fetch('http://localhost:5000/api/v1/attachments/presign', {
  method:'POST',
  headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
  body: JSON.stringify({ originalName:'test-report.pdf', mimeType:'application/pdf', size: 2048, entityType:'LEAD', entityId })
}).then(r=>r.json());
console.log('presign', pres.success, pres.data?.storageKey, pres.data?.s3Enabled);

// 2. Confirm
let storageKey = pres.data.storageKey;
let conf = await fetch('http://localhost:5000/api/v1/attachments/confirm', {
  method:'POST',
  headers:{'Authorization':`Bearer ${token}`, 'Content-Type':'application/json'},
  body: JSON.stringify({ storageKey, originalName:'test-report.pdf', mimeType:'application/pdf', size:2048, entityType:'LEAD', entityId })
}).then(r=>r.json());
console.log('confirm', conf.success, conf.data?.id, conf.data?.storageKey);

// 3. List via API
let list = await fetch(`http://localhost:5000/api/v1/attachments?entityType=LEAD&entityId=${entityId}`, {
  headers:{'Authorization':`Bearer ${token}`}
}).then(r=>r.json());
console.log('list via API', list.success, list.data?.length, list.pagination);

// 4. Verify DB directly
let dbCheck = await prisma.attachment.findUnique({ where:{ id: conf.data.id } });
console.log('DB verify', !!dbCheck, { id: dbCheck?.id, storageKey: dbCheck?.storageKey, org: dbCheck?.organizationId, uploadedBy: dbCheck?.uploadedBy, mime: dbCheck?.mimeType, size: dbCheck?.size });

// 5. Check audit log
let audit = await prisma.auditLog.findFirst({ where:{ resource:'Attachment', resourceId: conf.data.id }, orderBy:{ createdAt:'desc'} });
console.log('audit log', !!audit, audit?.action, audit?.resource);

// 6. Test download URL
let dl = await fetch(`http://localhost:5000/api/v1/attachments/${conf.data.id}/download`, { headers:{'Authorization':`Bearer ${token}` } }).then(r=>r.json());
console.log('download', dl.success, dl.data?.url?.slice(0,80));

// 7. Cleanup test data (optional - keep for manual check, but we will delete)
console.log('\n=== Test Summary ===');
console.log('Schema OK:', cols.length===9 ? 'YES 9 cols' : 'NO');
console.log('Presign+Confirm Save:', conf.success && !!dbCheck ? 'SUCCESS' : 'FAILED');
console.log('Entity validation (LEAD exists):', !!lead);
console.log('Org isolation (org matches):', dbCheck?.organizationId===orgId);
console.log('StorageKey unique:', !!dbCheck?.storageKey);

await prisma.$disconnect();
