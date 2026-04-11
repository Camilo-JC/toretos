import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { debtId, settleInfo } = await request.json()

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

    // MOCK: Enviar correo electrónico
    console.log(`[EMAIL MOCK] Enviando factura PDF a cliente (ID: ${result.customer.id})...`)
    console.log(`[EMAIL MOCK] Correo: ${info.email || result.customer.email || 'No proporcionado'}`)
    console.log(`[EMAIL MOCK] Método de Pago: ${info.method || 'Efectivo'}`)
    console.log(`[EMAIL MOCK] Factura pagada: ${result.total}`)

    return NextResponse.json({ success: true, debt: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
