const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin1234', 10)
  const updated = await prisma.user.update({
    where: { username: 'camilo' },
    data: { password: hashedPassword }
  })
  console.log('Contraseña de Camilo actualizada a: admin1234')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
