import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CRM...');

  // Permissions
  const resources = ['leads', 'contacts', 'companies', 'deals', 'pipelines', 'tasks', 'activities', 'notifications', 'reports', 'users', 'roles', 'organizations', 'admin'];
  const actions = ['create', 'read', 'update', 'delete'];
  const perms = [];
  for (const r of resources) {
    for (const a of actions) perms.push({ resource: r, action: a, slug: `${r}:${a}` });
  }
  // extra
  for (const slug of ['leads:assign', 'leads:convert', 'deals:close', 'admin:read']) {
    const [resource, action] = slug.split(':');
    perms.push({ resource, action, slug });
  }
  for (const p of perms) {
    await prisma.permission.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log(`  Permissions: ${perms.length}`);

  // Roles
  const roleDefs = [
    { name: 'Super Admin', slug: 'super_admin' },
    { name: 'Admin', slug: 'admin' },
    { name: 'Sales Manager', slug: 'sales_manager' },
    { name: 'Sales Representative', slug: 'sales_rep' },
    { name: 'Support Agent', slug: 'support_agent' },
    { name: 'Viewer', slug: 'viewer' },
  ];
  for (const r of roleDefs) {
    const existing = await prisma.role.findFirst({
      where: { slug: r.slug, organizationId: null },
    });
    if (!existing) {
      await prisma.role.create({
        data: { name: r.name, slug: r.slug, organizationId: null },
      });
    }
  }
  // Assign all perms to super_admin
  const superAdminRole = await prisma.role.findFirst({ where: { slug: 'super_admin' } });
  const allPerms = await prisma.permission.findMany();
  if (superAdminRole) {
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: perm.id },
      });
    }
  }
  console.log('  Roles seeded');

  // Demo org + users (dev only)
  const hashed = await bcrypt.hash('Password@123', 10);
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: { name: 'Demo Org', slug: 'demo-org', email: 'demo@crm.local', status: 'ACTIVE' },
  });

  const adminRole = await prisma.role.findFirst({ where: { slug: 'admin' } });
  const user = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: { email: 'admin@crm.local', password: hashed, firstName: 'Admin', lastName: 'User', roleId: adminRole?.id, status: 'ACTIVE', emailVerified: true },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: { organizationId: org.id, userId: user.id, roleId: adminRole?.id },
  });

  // Default pipeline
  const pipeline = await prisma.pipeline.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Sales Pipeline' } },
    update: {},
    create: { organizationId: org.id, name: 'Sales Pipeline', isDefault: true },
  });
  const stages = [
    { name: 'New', order: 1, probability: 10, color: '#94a3b8' },
    { name: 'Qualification', order: 2, probability: 30, color: '#38bdf8' },
    { name: 'Proposal', order: 3, probability: 60, color: '#f59e0b' },
    { name: 'Negotiation', order: 4, probability: 80, color: '#8b5cf6' },
    { name: 'Closed Won', order: 5, probability: 100, color: '#22c55e', isClosed: true },
    { name: 'Closed Lost', order: 6, probability: 0, color: '#ef4444', isClosed: true },
  ];
  for (const s of stages) {
    await prisma.pipelineStage.upsert({
      where: { pipelineId_order: { pipelineId: pipeline.id, order: s.order } },
      update: s,
      create: { pipelineId: pipeline.id, ...s },
    });
  }

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
