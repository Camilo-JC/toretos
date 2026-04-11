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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Historial de Ventas</h1>
        <p style={{ color: '#9ca3af' }}>Revisa todas las facturas que ya han sido saldadas en tu tienda.</p>
      </div>

      <HistoryClient paidDebts={JSON.parse(JSON.stringify(paidDebts))} />
    </div>
  )
}
