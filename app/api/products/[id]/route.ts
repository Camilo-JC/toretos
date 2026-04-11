import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const data = await request.json()
  const { id } = await params

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      stock: data.stock
    }
  })
  return NextResponse.json(product)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
