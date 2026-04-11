import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const { username, password } = await request.json()

  if (!username) return NextResponse.json({ error: 'Usuario requerido' }, { status: 400 })

  try {
    const data: any = { username }
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  try {
    // Only delete if it's a worker to protect admin
    const user = await prisma.user.findUnique({ where: { id } })
    if (user?.role === 'ADMIN') return NextResponse.json({ error: 'No se puede eliminar al admin' }, { status: 400 })

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Error eliminando usuario' }, { status: 500 })
  }
}
