import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const { id: customerId } = await params
  const { isGeneric, isAbono, amount, description, productId, quantity } = await request.json()

  if (isAbono && session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo el administrador puede registrar abonos' }, { status: 403 })
  }

  if (isGeneric || isAbono) {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }
    if (isGeneric && !description) {
      return NextResponse.json({ error: 'Descripción obligatoria' }, { status: 400 })
    }
  } else {
    if (!productId || quantity < 1) {
      return NextResponse.json({ error: 'Datos de inventario inválidos' }, { status: 400 })
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let lPrice = 0
      let totalItemAmount = 0
      
      const multiplier = isAbono ? -1 : 1

      if (!isGeneric && !isAbono) {
        // Tomar producto
        const product = await tx.product.findUnique({ where: { id: productId } })
        if (!product) throw new Error('Producto no encontrado')
        if (product.stock < quantity) throw new Error('Stock insuficiente')

        // Descontar stock
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } }
        })

        lPrice = product.price
        totalItemAmount = lPrice * quantity
      } else {
        lPrice = amount * multiplier
        totalItemAmount = amount * multiplier
      }

      // Buscar o crear deuda pendiente
      let debt = await tx.debt.findFirst({
        where: { customerId, status: 'PENDING' }
      })

      if (!debt && isAbono) {
        throw new Error('No puedes abonar a una cuenta sin deudas pendientes')
      }

      if (!debt) {
        debt = await tx.debt.create({
          data: { customerId, subtotal: 0 }
        })
      }

      // Validar que el abono no supere la deuda actual
      if (isAbono && amount > debt.subtotal) {
        throw new Error(`El abono ($${amount}) no puede ser mayor a la deuda actual ($${debt.subtotal})`)
      }

      // Crear item de deuda y aumentar subtotal
      await tx.debtItem.create({
        data: {
          debt: { connect: { id: debt.id } },
          // Solo conectar el producto si isGeneric o isAbono es falso
          ...(isGeneric || isAbono ? {} : { product: { connect: { id: productId } } }),
          description: isAbono ? 'Abono / Pago Parcial' : (isGeneric ? description : null),
          quantity: isGeneric || isAbono ? 1 : quantity,
          price: lPrice
        }
      })

      const updatedDebt = await tx.debt.update({
        where: { id: debt.id },
        data: { subtotal: { increment: totalItemAmount } },
        include: { items: true }
      })

      return updatedDebt
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
