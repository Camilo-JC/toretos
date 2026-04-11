import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const data = await request.json()
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: data.price,
      stock: data.stock
    }
  })
  return NextResponse.json(product)
}
