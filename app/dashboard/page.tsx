import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { startOfWeek, startOfMonth, subMonths, format, parseISO, startOfDay, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiArrowUpRight, FiArrowDownRight, FiShoppingBag, FiDownload, FiBox } from 'react-icons/fi'
import DashboardActions from '@/components/DashboardActions'
import Link from 'next/link'

export const revalidate = 0

// Utils to calculate percentage difference
const calcGrowth = (current: number, past: number) => {
  if (past === 0) return current > 0 ? 100 : 0
  return ((current - past) / past) * 100
}

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.role as string
  const adminName = session?.username || 'Admin'

  // Variables para calculos (Admin)
  let metrics = {
    hoyEntradas: 0,
    hoyCrecimiento: 0,
    mesActual: 0,
    mesCrecimiento: 0,
    dineroEnCalle: 0,
    moraCrecimiento: 0,
    totalHistorial: 0,
    historicoCrecimiento: 0
  }
  let chartData: { month: string; value: number; maxValue: number }[] = []
  let recentPurchases: any[] = []
  let lowStockProducts: any[] = []

  if (role === 'ADMIN') {
    const now = new Date()
    
    // Limits
    const startOfToday = startOfDay(now)
    const startOfYesterday = startOfDay(subDays(now, 1))
    const startOfThisMonth = startOfMonth(now)
    const startOfPrevMonth = startOfMonth(subMonths(now, 1))
    // 1. Fetch deudas pagadas para ingresos (Pagos Totales)
    const allPaid = await prisma.debt.findMany({
      where: { status: 'PAID' },
      include: { customer: true },
      orderBy: { paidAt: 'desc' }
    })

    // 2. Fetch deudas pendientes para mora/dinero en calle
    const pendingDebts = await prisma.debt.findMany({
      where: { status: 'PENDING' },
      include: { items: true }
    })

    // 3. Fetch ABONOS (Pagos parciales - son items con precio negativo)
    const allAbonos = await prisma.debtItem.findMany({
      where: { price: { lt: 0 } },
      include: { 
        debt: { 
          include: { customer: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    })

    // 4. Productos con stock bajo (limite 10)
    lowStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: 'asc' },
      take: 5
    })

    metrics.dineroEnCalle = pendingDebts.reduce((acc, d) => acc + (d.subtotal || 0), 0)

    let ayerIncome = 0
    let mesPasadoIncome = 0
    let historicoHaceMes = 0

    // PROCESAR LIQUIDACIONES (PAGOS TOTALES)
    allPaid.forEach(d => {
      if (!d.paidAt) return
      const amount = d.total || 0
      metrics.totalHistorial += amount

      if (d.paidAt >= startOfToday) {
        metrics.hoyEntradas += amount
      } else if (d.paidAt >= startOfYesterday && d.paidAt < startOfToday) {
        ayerIncome += amount
      }

      if (d.paidAt >= startOfThisMonth) {
        metrics.mesActual += amount
      } else if (d.paidAt >= startOfPrevMonth && d.paidAt < startOfThisMonth) {
        mesPasadoIncome += amount
      }

      if (d.paidAt < subMonths(now, 1)) {
        historicoHaceMes += amount
      }
    })

    // PROCESAR ABONOS (PAGOS PARCIALES)
    // El monto del abono es el valor absoluto del precio del item
    allAbonos.forEach(item => {
      const amount = Math.abs(item.price * item.quantity)
      metrics.totalHistorial += amount

      if (item.createdAt >= startOfToday) {
        metrics.hoyEntradas += amount
      } else if (item.createdAt >= startOfYesterday && item.createdAt < startOfToday) {
        ayerIncome += amount
      }

      if (item.createdAt >= startOfThisMonth) {
        metrics.mesActual += amount
      } else if (item.createdAt >= startOfPrevMonth && item.createdAt < startOfThisMonth) {
        mesPasadoIncome += amount
      }

      if (item.createdAt < subMonths(now, 1)) {
        historicoHaceMes += amount
      }
    })

    // Calcular crecimiento real
    metrics.hoyCrecimiento = calcGrowth(metrics.hoyEntradas, ayerIncome)
    metrics.mesCrecimiento = calcGrowth(metrics.mesActual, mesPasadoIncome)
    metrics.historicoCrecimiento = calcGrowth(metrics.totalHistorial, historicoHaceMes)

    // Crecimiento de mora (comparado con el inicio del mes)
    const deudasViejas = pendingDebts.reduce((acc, d) => {
      const subtotalViejo = d.items
        .filter(item => item.createdAt < startOfThisMonth)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      return acc + subtotalViejo
    }, 0)
    metrics.moraCrecimiento = calcGrowth(metrics.dineroEnCalle, deudasViejas)

    // 5. Chart Data Generation (Last 4 Months) - Agregando Liquidaciones + Abonos
    let monthsAgg = [
      { date: startOfMonth(subMonths(now, 3)), value: 0 },
      { date: startOfMonth(subMonths(now, 2)), value: 0 },
      { date: startOfPrevMonth, value: 0 },
      { date: startOfThisMonth, value: 0 },
    ]

    allPaid.forEach(d => {
      if (!d.paidAt) return
      for (const m of monthsAgg) {
        if (d.paidAt.getFullYear() === m.date.getFullYear() && d.paidAt.getMonth() === m.date.getMonth()) {
          m.value += (d.total || 0)
        }
      }
    })

    allAbonos.forEach(item => {
      for (const m of monthsAgg) {
        if (item.createdAt.getFullYear() === m.date.getFullYear() && item.createdAt.getMonth() === m.date.getMonth()) {
          m.value += Math.abs(item.price * item.quantity)
        }
      }
    })

    const absoluteMax = Math.max(...monthsAgg.map(m => m.value), 1000)
    const niceMax = Math.ceil(absoluteMax / 50000) * 50000
    
    chartData = monthsAgg.map(m => ({
      month: format(m.date, 'MMM yyyy', { locale: es }).toUpperCase(),
      value: m.value,
      maxValue: niceMax
    }))

    // 6. Cobros Recientes (Combinando Liquidaciones y Abonos)
    const combinedRecents = [
      ...allPaid.map(d => ({ 
        id: d.id, 
        name: d.customer?.name || 'Venta', 
        amount: d.total, 
        date: d.paidAt, 
        type: 'LIQUIDACION' 
      })),
      ...allAbonos.map(item => ({ 
        id: item.id, 
        name: item.debt?.customer?.name || 'Abono', 
        amount: Math.abs(item.price * item.quantity), 
        date: item.createdAt, 
        type: 'ABONO' 
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    recentPurchases = combinedRecents.slice(0, 4)
  }

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(num)
  }

  const GrowthTag = ({ value }: { value: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: value >= 0 ? '#10b981' : '#ef4444', fontSize: '0.875rem', fontWeight: 'bold' }}>
      {value >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </div>
  )

  const MetricItem = ({ title, value, growth, highlight = false, color = 'white' }: any) => (
    <div className="dashboard-metric-item">
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{title}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: highlight ? 'var(--primary)' : color, marginBottom: '0.5rem' }}>
        {formatCOP(value)}
      </p>
      <GrowthTag value={growth} />
    </div>
  )

  if (role !== 'ADMIN') {
    return (
      <div className="card" style={{ backgroundColor: 'var(--primary-light)', border: 'none' }}>
        <div className="card-body" style={{ color: 'var(--primary-hover)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>¡Bienvenido a tu turno!</h3>
          <p>Desde aquí puedes gestionar el inventario y atender los fiados de los clientes.</p>
        </div>
      </div>
    )
  }

  // Obtenemos el maximo de chartData para las etiquetas
  const currentMax = chartData[0]?.maxValue || 100000

  const formatShortValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k'
    return val.toString()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* HEADER PREMIUM */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', paddingTop: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
            Bienvenido, {adminName.charAt(0).toUpperCase() + adminName.slice(1)}
          </h1>
          <p style={{ color: '#9ca3af' }}>Consulta la información más reciente de tu tienda</p>
        </div>
        <DashboardActions metrics={metrics} />
      </div>

      {/* 4 METRICS BANNER */}
      <div className="dashboard-metrics-container">
        <MetricItem title="Plata que entró hoy" value={metrics.hoyEntradas} growth={metrics.hoyCrecimiento} highlight />
        <MetricItem title="Ventas este Mes" value={metrics.mesActual} growth={metrics.mesCrecimiento} />
        <div className="dashboard-metric-item">
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Dinero en la Calle (Fiados)</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            {formatCOP(metrics.dineroEnCalle)}
          </p>
          <GrowthTag value={metrics.moraCrecimiento} />
        </div>
        <MetricItem title="Historial Total" value={metrics.totalHistorial} growth={metrics.historicoCrecimiento} />
      </div>

      <div className="dashboard-main-grid">
        
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 'bold', color: 'white' }}>¿Cómo van las ventas?</h3>
            <div style={{ border: '1px solid var(--border)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem', color: '#9ca3af' }}>
              Último Semestre
            </div>
          </div>
          
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', marginTop: '2rem', borderBottom: '2px solid #e5e7eb', marginLeft: '3.5rem' }}>
            {/* Guias visuales horizontales DINAMICAS */}
            {[1, 0.75, 0.5, 0.25].map((factor, idx) => {
              const labelValue = currentMax * factor
              return (
                <div key={idx} style={{ position: 'absolute', top: `${(1 - factor) * 100}%`, left: 0, width: '100%', borderTop: '1px solid #374151', zIndex: 0 }}>
                  <span style={{ position: 'absolute', top: '-10px', left: '-45px', fontSize: '0.75rem', color: '#9ca3af', width: '40px', textAlign: 'right' }}>{formatShortValue(labelValue)}</span>
                </div>
              )
            })}

            {chartData.map((data, i) => {
              const heightPercent = Math.max((data.value / data.maxValue) * 100, data.value > 0 ? 3 : 0)
              const isCurrent = i === chartData.length - 1
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1, width: '60px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: `${heightPercent}%`, 
                    background: isCurrent ? 'linear-gradient(180deg, var(--primary) 0%, #4338ca 100%)' : '#1e1b4b', 
                    borderRadius: '6px 6px 0 0', 
                    transition: 'height 1s ease-out',
                    boxShadow: isCurrent ? '0 0 15px rgba(67, 56, 202, 0.4)' : 'none',
                    position: 'relative'
                  }}>
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        {formatShortValue(data.value)}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>{data.month.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '1.5rem', border: '1px solid var(--border)', borderLeft: '4px solid var(--danger)' }}>
            <h3 style={{ fontWeight: 'bold', color: 'white', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBox color="var(--danger)" /> Productos por acabarse
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockProducts.length === 0 ? (
                <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>Todo el inventario está al día.</p>
              ) : (
                lowStockProducts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'white' }}>{p.name}</span>
                    <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {p.stock} uni.
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>Cobros recientes</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {recentPurchases.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No hay cobros recientes.</p>
              ) : (
                recentPurchases.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: i === recentPurchases.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: r.type === 'ABONO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.type === 'ABONO' ? '#3b82f6' : '#10b981' }}>
                      <FiShoppingBag />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>{r.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{format(new Date(r.date), 'd MMM, p', { locale: es })} • <span style={{ color: r.type === 'ABONO' ? '#3b82f6' : '#10b981', fontWeight: 'bold' }}>{r.type}</span></p>
                    </div>
                    <p style={{ fontWeight: 'bold', color: '#10b981' }}>+{formatCOP(r.amount)}</p>
                  </div>
                ))
              )}
            </div>

            <Link href="/dashboard/history" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', border: 'none', backgroundColor: '#374151', color: 'white', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
              Ver todo el historial
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
