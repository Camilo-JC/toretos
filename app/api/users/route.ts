import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const workers = await prisma.user.findMany({
    where: { role: 'WORKER' },
    select: { id: true, username: true, role: true, createdAt: true }
  })
  
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, username: true }
  })

  return NextResponse.json({ workers, adminUsername: admin?.username })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { username, password } = await request.json()

  if (!username || !password || username.length < 3) {
    return NextResponse.json({ error: 'Datos de usuario inválidos' }, { status: 400 })
  }

  // Check unique
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 })

  const hashedPassword = await bcrypt.hash(password, 10)

  const worker = await prisma.user.create({
    data: {
      username,
      name: username, // Added missing required field
      password: hashedPassword,
      role: 'WORKER'
    },
    select: { id: true, username: true }
  })

  return NextResponse.json({ success: true, worker })
}
