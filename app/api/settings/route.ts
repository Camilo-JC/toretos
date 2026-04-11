import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { storeName, password, adminUsername } = await request.json()

  // Update Settings
  let settings = await prisma.settings.findFirst()
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { storeName }
    })
  } else {
    await prisma.settings.create({
      data: { storeName }
    })
  }

  // Update Admin Details
  if (password || adminUsername) {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (adminUser) {
      const data: any = {}
      if (password) data.password = await bcrypt.hash(password, 10)
      if (adminUsername) data.username = adminUsername
      if (Object.keys(data).length > 0) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
