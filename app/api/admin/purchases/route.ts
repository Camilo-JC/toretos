import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const purchases = await prisma.purchase.findMany({
    include: {
      product: true,
      supplier: true
    },
    orderBy: { date: 'desc' }
  })
  return NextResponse.json(purchases)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const data = await request.json()
  const { productId, supplierId, quantity, unitCost } = data

  if (!productId || !supplierId || !quantity || !unitCost) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de compra
      const purchase = await tx.purchase.create({
        data: {
          productId,
          supplierId,
          quantity,
          unitCost,
          totalCost: quantity * unitCost,
          date: data.date ? new Date(data.date) : new Date()
        }
      })

      // 2. Aumentar stock del producto
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } }
      })

      return purchase
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error registrando compra' }, { status: 500 })
  }
}
