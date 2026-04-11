import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sendReceipt } from '@/lib/email'
import { Prisma } from '@prisma/client'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { debtId, settleInfo } = await request.json()
  const { id } = await params

  try {
    const result = await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUnique({ where: { id: debtId } })
      if (!debt || debt.status !== 'PENDING') throw new Error('Deuda invalida')

      const totalWithCommission = debt.subtotal * 1.05

      const paidDebt = await tx.debt.update({
        where: { id: debtId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          total: totalWithCommission
        },
        include: { items: true, customer: true }
      })

      return paidDebt
    })

    const info = settleInfo || {}
    const customerEmail = info.email || result.customer.email

    if (customerEmail) {
      await sendReceipt(
        customerEmail,
        result.customer.name,
        result.total,
        { id: result.id, method: info.method || 'Efectivo' }
      )
    }

    return NextResponse.json({ success: true, debt: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
