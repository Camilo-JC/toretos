const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('--- DETALLE DE USUARIOS ---')
  users.forEach(u => {
    console.log(`ID: "${u.id}", Username: "${u.username}", Length: ${u.username.length}, Role: ${u.role}`)
  })

  // Reset password to 'admin123' to match the user's latest attempt
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.update({
    where: { username: 'camilo' },
    data: { password: hashedPassword }
  })
  console.log('\n>>> Contraseña de "camilo" actualizada a: admin123')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
