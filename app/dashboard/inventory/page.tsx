import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import InventoryClient from '@/app/dashboard/inventory/InventoryClient'

export const revalidate = 0

export default async function InventoryPage() {
  const session = await getSession()
  const role = (session?.role as string) || 'WORKER'

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <InventoryClient initialProducts={products} role={role} />
}
