import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import CustomersClient from './CustomersClient'

export const revalidate = 0

export default async function CustomersPage() {
  const session = await getSession()
  const role = session?.role as string

  const customers = await prisma.customer.findMany({
    include: {
      debts: {
        where: { status: 'PENDING' },
        include: { items: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Prepare inventory for the modal dropdown
  const inventory = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  })

  return <CustomersClient initialCustomers={customers} role={role} inventory={inventory} />
}
