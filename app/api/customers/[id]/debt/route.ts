import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const { id: customerId } = await params
  const { isGeneric, isAbono, amount, description, productId, quantity, items } = await request.json()

  if (isAbono && session?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo el administrador puede registrar abonos' }, { status: 403 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let lItems: { productId?: string, quantity: number, price: number, description?: string, total: number }[] = []
      
      const multiplier = isAbono ? -1 : 1

      if (isGeneric || isAbono) {
        if (!amount || amount <= 0) throw new Error('Monto inválido')
        if (isGeneric && !description) throw new Error('Descripción obligatoria')
        
        lItems.push({
          price: amount * multiplier,
          quantity: 1,
          total: amount * multiplier,
          description: isAbono ? 'Abono / Pago Parcial' : description
        })
      } else if (items && Array.isArray(items)) {
        // Multi-item inventory
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) throw new Error(`Producto ${item.productId} no encontrado`)
          if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`)

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })

          lItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
            total: product.price * item.quantity
          })
        }
      } else {
        // Single item inventory (compatibility)
        if (!productId || quantity <= 0) throw new Error('Datos de inventario inválidos')
        
        const product = await tx.product.findUnique({ where: { id: productId } })
        if (!product) throw new Error('Producto no encontrado')
        if (product.stock < quantity) throw new Error('Stock insuficiente')

        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } }
        })

        lItems.push({
          productId,
          quantity,
          price: product.price,
          total: product.price * quantity
        })
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

      const totalTransactionAmount = lItems.reduce((acc, curr) => acc + curr.total, 0)

      // Validar que el abono no supere la deuda actual
      if (isAbono && amount > debt.subtotal) {
        throw new Error(`El abono ($${amount}) no puede ser mayor a la deuda actual ($${debt.subtotal})`)
      }

      // Crear items de deuda
      for (const item of lItems) {
        await tx.debtItem.create({
          data: {
            debt: { connect: { id: debt.id } },
            ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
            description: item.description || null,
            quantity: item.quantity,
            price: item.price
          }
        })
      }

      const updatedDebt = await tx.debt.update({
        where: { id: debt.id },
        data: { subtotal: { increment: totalTransactionAmount } },
        include: { items: true }
      })

      return updatedDebt
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
