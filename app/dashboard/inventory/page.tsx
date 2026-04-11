import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import InventoryClient from './InventoryClient'

export const revalidate = 0

export default async function InventoryPage() {
  const session = await getSession()
  const role = session?.role as string

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <InventoryClient initialProducts={products} role={role} />
}
