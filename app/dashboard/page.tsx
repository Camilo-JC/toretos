import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { startOfWeek, startOfMonth, startOfYear, subMonths, format, startOfDay, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiArrowUpRight, FiArrowDownRight, FiShoppingBag, FiDownload, FiBox, FiTrendingUp, FiCalendar, FiDollarSign, FiClock } from 'react-icons/fi'
import DashboardActions from '@/components/DashboardActions'
import Link from 'next/link'

export const revalidate = 0

interface AppSession {
  userId: string;
  role: string;
  username: string;
}

// Utils to calculate percentage difference
const calcGrowth = (current: number, past: number) => {
  if (past === 0) return current > 0 ? 100 : 0
  return ((current - past) / past) * 100
}

export default async function DashboardPage() {
  console.log(">>> DASHBOARD_V2_LOADED <<<")
  const session = (await getSession()) as unknown as AppSession
  const role = session?.role || 'WORKER'
  const adminName = (session?.username as string) || 'Admin'

  // Variables para calculos (Admin)
  let metrics = {
    hoyEntradas: 0,
    semanaActual: 0,
    mesActual: 0,
    anioActual: 0,
    dineroEnCalle: 0,
    totalHistorial: 0,
    // Growth metrics are calculated vs previous period
    hoyCrecimiento: 0,
    mesCrecimiento: 0,
    moraCrecimiento: 0,
  }
  let chartData: { month: string; value: number; maxValue: number }[] = []
  let recentPurchases: any[] = []
  let lowStockProducts: any[] = []

  if (role === 'ADMIN') {
    const now = new Date()
    
    // Limits
    const startOfToday = startOfDay(now)
    const startOfYesterday = startOfDay(subDays(now, 1))
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const startOfThisMonth = startOfMonth(now)
    const startOfPrevMonth = startOfMonth(subMonths(now, 1))
    const startOfThisYear = startOfYear(now)

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

    metrics.dineroEnCalle = pendingDebts.reduce((acc: number, d: any) => acc + (d.subtotal || 0), 0)

    let ayerIncome = 0
    let mesPasadoIncome = 0

    const processAmount = (date: Date | null, amount: number) => {
      if (!date) return
      metrics.totalHistorial += amount

      if (date >= startOfToday) metrics.hoyEntradas += amount
      else if (date >= startOfYesterday && date < startOfToday) ayerIncome += amount

      if (date >= startOfThisWeek) metrics.semanaActual += amount
      if (date >= startOfThisMonth) metrics.mesActual += amount
      if (date >= startOfThisYear) metrics.anioActual += amount

      if (date >= startOfPrevMonth && date < startOfThisMonth) mesPasadoIncome += amount
    }

    // PROCESAR LIQUIDACIONES (PAGOS TOTALES)
    allPaid.forEach((d: any) => processAmount(d.paidAt, d.total || 0))

    // PROCESAR ABONOS (PAGOS PARCIALES)
    allAbonos.forEach((item: any) => processAmount(item.createdAt, Math.abs(item.price * item.quantity)))

    // Calcular crecimiento
    metrics.hoyCrecimiento = calcGrowth(metrics.hoyEntradas, ayerIncome)
    metrics.mesCrecimiento = calcGrowth(metrics.mesActual, mesPasadoIncome)

    // Crecimiento de mora (comparado con el inicio del mes)
    const deudasViejas = pendingDebts.reduce((acc: number, d: any) => {
      const subtotalViejo = d.items
        .filter((item: any) => item.createdAt < startOfThisMonth)
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
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

    allPaid.forEach((d: any) => {
      if (!d.paidAt) return
      for (const m of monthsAgg) {
        if (d.paidAt.getFullYear() === m.date.getFullYear() && d.paidAt.getMonth() === m.date.getMonth()) {
          m.value += (d.total || 0)
        }
      }
    })

    allAbonos.forEach((item: any) => {
      for (const m of monthsAgg) {
        if (item.createdAt.getFullYear() === m.date.getFullYear() && item.createdAt.getMonth() === m.date.getMonth()) {
          m.value += Math.abs(item.price * item.quantity)
        }
      }
    })

    const absoluteMax = Math.max(...monthsAgg.map((m: any) => m.value), 1000)
    const niceMax = Math.ceil(absoluteMax / 50000) * 50000
    
    chartData = monthsAgg.map((m: any) => ({
      month: format(m.date, 'MMM yyyy', { locale: es }).toUpperCase(),
      value: m.value,
      maxValue: niceMax
    }))

    // 6. Cobros Recientes (Combinando Liquidaciones y Abonos)
    const combinedRecents: any[] = [
      ...allPaid.map((d: any) => ({ 
        id: d.id, 
        name: d.customer?.name || 'Venta', 
        amount: d.total, 
        date: d.paidAt || d.createdAt, 
        type: 'LIQUIDACION' 
      })),
      ...allAbonos.map((item: any) => ({ 
        id: item.id, 
        name: item.debt?.customer?.name || 'Abono', 
        amount: Math.abs(item.price * item.quantity), 
        date: item.createdAt, 
        type: 'ABONO' 
      }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    recentPurchases = combinedRecents.slice(0, 4)
  }

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 2
    }).format(num)
  }

  const MetricCard = ({ title, value, growth, icon: Icon, color, suffix = "" }: any) => {
    const isPositive = growth > 0
    return (
      <div className="dashboard-metric-card glass animate-fade-in" style={{ 
        padding: '1.5rem', 
        borderRadius: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '12px' }}>
            <Icon size={24} color={color} />
          </div>
          {growth !== undefined && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '0.75rem', 
              fontWeight: 'bold',
              color: isPositive ? '#10b981' : '#ef4444',
              backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '4px 8px',
              borderRadius: '20px'
            }}>
              {isPositive ? <FiArrowUpRight /> : <FiArrowDownRight />}
              {Math.abs(growth).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', margin: 0 }}>{title}</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
            {formatCOP(value)}{suffix}
          </h2>
        </div>
      </div>
    )
  }

  if (role !== 'ADMIN') {
    return (
      <div className="card" style={{ backgroundColor: 'var(--primary-light)', border: 'none', borderRadius: '24px' }}>
        <div className="card-body" style={{ color: 'var(--primary-hover)', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>¡Hola de nuevo, {adminName}!</h3>
          <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>Gestiona el inventario y los fiados con la mejor energía para hoy. 💪</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER DE BIENVENIDA */}
      <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div className="page-header-info">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
            Panel de Control ✨
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Resumen financiero de <strong>Los Toreto</strong> para {format(new Date(), "MMMM d, yyyy", { locale: es })}.</p>
        </div>
        <DashboardActions metrics={metrics} />
      </div>

      {/* REJILLA DE MÉTRICAS - 6 TARJETAS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <MetricCard 
          title="Ingresos de Hoy" 
          value={metrics.hoyEntradas} 
          growth={metrics.hoyCrecimiento} 
          icon={FiDollarSign} 
          color="#6366f1" 
        />
        <MetricCard 
          title="Esta Semana" 
          value={metrics.semanaActual} 
          icon={FiTrendingUp} 
          color="#8b5cf6" 
        />
        <MetricCard 
          title="Ventas del Mes" 
          value={metrics.mesActual} 
          growth={metrics.mesCrecimiento} 
          icon={FiCalendar} 
          color="#ec4899" 
        />
        <MetricCard 
          title="Balance del Año" 
          value={metrics.anioActual} 
          icon={FiTrendingUp} 
          color="#10b981" 
        />
        <MetricCard 
          title="Dinero en la Calle" 
          value={metrics.dineroEnCalle} 
          growth={metrics.moraCrecimiento} 
          icon={FiClock} 
          color="#f59e0b" 
        />
        <MetricCard 
          title="Historial Acumulado" 
          value={metrics.totalHistorial} 
          icon={FiShoppingBag} 
          color="#06b6d4" 
        />
      </div>

      <div className="animate-fade-in" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* Productos por acabarse */}
        <div className="glass" style={{ borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--border)', borderTop: '5px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '800', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <FiBox color="var(--danger)" /> Stock Crítico
            </h3>
            <Link href="/dashboard/inventory" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>Gestionar todo</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px' }}>
                <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0, fontWeight: '600' }}>✅ Todo el inventario está al día.</p>
              </div>
            ) : (
              lowStockProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <span style={{ color: 'white', fontWeight: '600' }}>{p.name}</span>
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                    {p.stock} {p.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cobros recientes */}
        <div className="glass" style={{ borderRadius: '24px', padding: '1.75rem', border: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: '800', color: 'white', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Actividad Reciente</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentPurchases.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay movimientos registrados.</p>
            ) : (
              recentPurchases.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '16px', transition: 'background 0.2s' }}>
                  <div style={{ 
                    width: '45px', 
                    height: '45px', 
                    borderRadius: '14px', 
                    backgroundColor: r.type === 'ABONO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: r.type === 'ABONO' ? '#3b82f6' : '#10b981' 
                  }}>
                    <FiShoppingBag size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', margin: 0 }}>{r.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                      {format(new Date(r.date), 'p', { locale: es })} • <span style={{ color: r.type === 'ABONO' ? '#3b82f6' : '#10b981', fontWeight: 'bold', fontSize: '0.7rem' }}>{r.type}</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '900', color: '#10b981', margin: 0 }}>+{formatCOP(r.amount).split(',')[0]}</p>
                  </div>
                 </div>
              ))
            )}
          </div>

          <Link href="/dashboard/history" style={{ 
            width: '100%', 
            marginTop: '1.5rem', 
            padding: '1rem', 
            border: 'none', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            color: 'white', 
            borderRadius: '16px', 
            fontWeight: '800', 
            cursor: 'pointer', 
            textAlign: 'center', 
            display: 'block',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}>
            Ver historial completo
          </Link>
        </div>
      </div>
    </div>
  )
}
