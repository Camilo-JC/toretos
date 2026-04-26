import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import PurchasesClient from './PurchasesClient'

export const revalidate = 0

export default async function PurchasesPage() {
  const session = await getSession()
  if (session?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const purchases = await prisma.purchase.findMany({
    include: {
      product: true,
      supplier: true
    },
    orderBy: { date: 'desc' }
  })

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  })

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  // Convert dates to string for serialization
  const serializedPurchases = purchases.map(p => ({
    ...p,
    date: p.date.toISOString()
  }))

  return (
    <PurchasesClient 
      initialPurchases={serializedPurchases as any} 
      suppliers={suppliers as any} 
      products={products as any} 
    />
  )
}
