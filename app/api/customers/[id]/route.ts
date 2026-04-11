import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      debts: {
        where: { status: 'PENDING' },
        include: { items: true }
      }
    }
  })

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(customer)
}

import { getSession } from '@/lib/session'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo el administrador puede eliminar clientes' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.$transaction([
      prisma.debtItem.deleteMany({ where: { debt: { customerId: id } } }),
      prisma.debt.deleteMany({ where: { customerId: id } }),
      prisma.customer.delete({ where: { id } })
    ])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE_CLIENT_ERROR]', err)
    return NextResponse.json({ error: err.message || 'No se pudo eliminar el cliente' }, { status: 500 })
  }
}
