import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const workerPassword = await bcrypt.hash('worker123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Owner',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const worker = await prisma.user.upsert({
    where: { username: 'worker' },
    update: {},
    create: {
      name: 'Empleado 1',
      username: 'worker',
      password: workerPassword,
      role: 'WORKER',
    },
  })

  const settings = await prisma.settings.create({
    data: {
      storeName: 'Los Toreto',
    }
  })

  console.log({ admin, worker, settings })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
