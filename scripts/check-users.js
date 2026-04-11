const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      role: true,
      name: true
    }
  })
  console.log('--- USUARIOS EN BASE DE DATOS ---')
  console.table(users)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
