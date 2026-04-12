import prisma from '@/lib/prisma'
import HistoryClient from './HistoryClient'

export const revalidate = 0

export default async function HistoryPage() {
  const paidDebts = await prisma.debt.findMany({
    where: { status: 'PAID' },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      paidAt: 'desc'
    }
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Historial de Ventas</h1>
          <p>Revisa todas las facturas que ya han sido saldadas en tu tienda.</p>
        </div>
      </div>

      <HistoryClient paidDebts={JSON.parse(JSON.stringify(paidDebts))} />
    </div>
  )
}
