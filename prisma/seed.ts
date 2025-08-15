import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  const categories = [
    { name: 'Próximo a vencer', slug: 'proximo-a-vencer' },
    { name: 'Defecto estético', slug: 'defecto-estetico' },
    { name: 'Sobrestock', slug: 'sobrestock' },
    { name: 'Sin TACC', slug: 'sin-tacc' },
    { name: 'Vegano', slug: 'vegano' },
    { name: 'Huerta local', slug: 'huerta-local' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✅ Categorías creadas');
}

async function seedDemoUser() {
  const email = 'client@demo.com';
  const password = 'client123';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('ℹ️ Usuario demo ya existe');
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, fullName: 'Cliente Demo' },
  });

  console.log(`✅ Usuario demo creado: ${email} / ${password}`);
  return user;
}

async function seedVendors(ownerId: number) {
  const vendors = [
    {
      name: 'Cafetería El Gato',
      openingHours: new Date('2023-10-01T08:00:00.000Z'),
      closingHours: new Date('2023-10-01T20:00:00.000Z'),
      address: 'Calle Falsa 123',
    },
    {
      name: 'Pizzería Don Queso',
      openingHours: new Date('2023-10-01T10:00:00.000Z'),
      closingHours: new Date('2023-10-01T22:00:00.000Z'),
      address: 'Avenida Siempre Viva 456',
    },
    {
      name: 'Taco Tóxico',
      openingHours: new Date('2023-10-01T11:00:00.000Z'),
      closingHours: new Date('2023-10-01T23:00:00.000Z'),
      address: 'Plaza Mayor 789',
    },
  ];

  const createdVendors = [];
  for (const vendor of vendors) {
    const v = await prisma.vendor.upsert({
      where: { name: vendor.name },
      update: { ownerId },              // ← siempre setear ownerId en update
      create: { ...vendor, ownerId },   // ← y en create
    });
    createdVendors.push(v);
  }
  console.log('✅ Vendors creados con ownerId');
}


async function seedProducts() {
  const [categoria1, categoria2, categoria3] = await Promise.all([
    prisma.category.findUnique({ where: { slug: 'proximo-a-vencer' } }),
    prisma.category.findUnique({ where: { slug: 'defecto-estetico' } }),
    prisma.category.findUnique({ where: { slug: 'sobrestock' } }),
  ]);

  const [vendor1, vendor2] = await Promise.all([
    prisma.vendor.findUnique({ where: { name: 'Cafetería El Gato' } }),
    prisma.vendor.findUnique({ where: { name: 'Pizzería Don Queso' } }),
  ]);

  if (!categoria1 || !categoria2 || !categoria3 || !vendor1 || !vendor2) {
    throw new Error('❌ Faltan categorías o vendors para asignar productos.');
  }

  const products = [
    {
      name: 'Café con leche',
      price: 1500,
      vendorId: vendor1.id,
      categoryId: categoria1.id,
    },
    {
      name: 'Empanada de jamón y queso',
      price: 2000,
      vendorId: vendor2.id,
      categoryId: categoria2.id,
    },
    {
      name: 'Alfajor artesanal',
      price: 1200,
      vendorId: vendor2.id,
      categoryId: categoria3.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }

  console.log('✅ Productos creados');
}

async function main() {
  await seedCategories();
  const demoUser = await seedDemoUser();          // ← primero el user
  await seedVendors(demoUser.id);                 // ← luego vendors + MpAccount con owner
  await seedProducts();                           // ← después productos
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
