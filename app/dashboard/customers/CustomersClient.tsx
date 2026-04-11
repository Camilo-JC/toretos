'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiUserPlus, FiCheckCircle, FiTrash2, FiArrowLeft } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Product = {
  id: string, name: string, stock: number, price: number
}

type DebtItem = {
  id: string, productId: string | null, description: string | null, quantity: number, price: number, createdAt: Date
}

type Debt = {
  id: string, status: string, subtotal: number, items: DebtItem[]
}

type Customer = {
  id: string, name: string, document: string | null, phone: string | null, debts: Debt[]
}

export default function CustomersClient({ initialCustomers, role, inventory }: { initialCustomers: Customer[], role: string, inventory: Product[] }) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [customerForm, setCustomerForm] = useState({ name: '', document: '', phone: '' })

  const [isFiadoOpen, setIsFiadoOpen] = useState(false)
  const [fiadoMode, setFiadoMode] = useState<'inventory' | 'generic' | 'abono'>('inventory')
  const [fiadoForm, setFiadoForm] = useState({ productId: '', quantity: 1 })
  const [genericForm, setGenericForm] = useState({ 
    description: format(new Date(), "EEEE d 'de' MMMM", { locale: es }), 
    amount: '' 
  })
  const [abonoForm, setAbonoForm] = useState({ amount: '' })

  // Nuevo: Settle (Saldar) Modal
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
  const [settleForm, setSettleForm] = useState({ email: '', accountName: '', method: 'Efectivo' })

  // Control de vista en móvil (CSS se encarga del layout, JS del toggle de visibilidad)
  const [showDetail, setShowDetail] = useState(false)

  const [loading, setLoading] = useState(false)

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(num)
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerForm)
    })
    if (res.ok) {
      const saved = await res.json()
      setCustomers([{...saved, debts: []}, ...customers])
      setIsNewCustomerOpen(false)
      setCustomerForm({ name: '', document: '', phone: '' })
    } else {
      alert('Error creando cliente')
    }
    setLoading(false)
  }

  const handleAddFiado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setLoading(true)

    let payload: any = {}
    if (fiadoMode === 'inventory') {
      payload = { isGeneric: false, isAbono: false, ...fiadoForm }
    } else if (fiadoMode === 'generic') {
      payload = { isGeneric: true, isAbono: false, description: genericForm.description, amount: Number(genericForm.amount) }
    } else {
      const amount = Number(abonoForm.amount)
      const currentDebt = selectedCustomer.debts[0]?.subtotal || 0
      if (amount > currentDebt) {
        alert(`No puedes abonar ${formatCOP(amount)} porque la deuda actual es de ${formatCOP(currentDebt)}.`)
        setLoading(false)
        return
      }
      payload = { isGeneric: false, isAbono: true, amount }
    }

    const res = await fetch(`/api/customers/${selectedCustomer.id}/debt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const updatedDebt = await res.json()
      const resCustomer = await fetch(`/api/customers/${selectedCustomer.id}`)
      const updatedCustomer = await resCustomer.json()
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c))
      setSelectedCustomer(updatedCustomer)
      setIsFiadoOpen(false)
      setFiadoForm({ productId: '', quantity: 1 })
      setGenericForm({ 
        description: format(new Date(), "EEEE d 'de' MMMM", { locale: es }), 
        amount: '' 
      })
      setAbonoForm({ amount: '' })
    } else {
      const data = await res.json()
      alert(data.error || 'Error añadiendo registro')
    }
    setLoading(false)
  }

  const executeSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    const pendingDebt = selectedCustomer.debts[0]
    if (!pendingDebt) return

    setLoading(true)
    const res = await fetch(`/api/customers/${selectedCustomer.id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debtId: pendingDebt.id, settleInfo: settleForm })
    })

    if (res.ok) {
      const data = await res.json()
      alert('Cuenta saldada exitosamente.')
      // Generate PDF
      const generatePDF = (await import('@/lib/pdf')).generateReceiptPDF
      generatePDF(selectedCustomer, data.debt, settleForm)
      
      const resCustomer = await fetch(`/api/customers/${selectedCustomer.id}`)
      const updatedCustomer = await resCustomer.json()
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c))
      setSelectedCustomer(null)
      setShowDetail(false)
      setIsSettleModalOpen(false)
      setSettleForm({ email: '', accountName: '', method: 'Efectivo' })
    } else {
      alert('Error saldando la cuenta')
    }
    setLoading(false)
  }

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return
    const countDebts = selectedCustomer.debts && selectedCustomer.debts.length > 0 && selectedCustomer.debts[0].subtotal > 0
    const msg = countDebts 
      ? `¡ADVERTENCIA! ${selectedCustomer.name} tiene una deuda PENDIENTE de ${formatCOP(selectedCustomer.debts[0].subtotal)}.\n\n¿Estás SEGURO de que deseas ELIMINAR este cliente y todo su historial para siempre?`
      : `¿Deseas eliminar a ${selectedCustomer.name} de la base de datos?`

    if (!confirm(msg)) return

    setLoading(true)
    const res = await fetch(`/api/customers/${selectedCustomer.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCustomers(customers.filter(c => c.id !== selectedCustomer.id))
      setSelectedCustomer(null)
      alert('Cliente eliminado.')
    } else {
      const data = await res.json()
      alert(data.error || 'Error eliminando el cliente')
    }
    setLoading(false)
  }

  return (
    <div className={`customers-layout ${showDetail ? 'show-detail' : ''}`}>
      {/* List Sidebar */}
      <div className="customers-sidebar animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Clientes</h2>
          <button className="btn btn-secondary" onClick={() => setIsNewCustomerOpen(true)} style={{ padding: '0.6rem' }}>
            <FiUserPlus size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {customers.map(c => {
            const hasDebt = c.debts && c.debts.length > 0 && c.debts[0].subtotal > 0
            return (
              <div 
                key={c.id} 
                className="card" 
                style={{ 
                  cursor: 'pointer', 
                  border: selectedCustomer?.id === c.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  transition: 'transform 0.2s',
                  transform: selectedCustomer?.id === c.id ? 'scale(1.02)' : 'none'
                }}
                onClick={() => {
                  setSelectedCustomer(c)
                  setShowDetail(true)
                }}
              >
                <div className="card-body" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: '600', fontSize: '1.1rem' }}>{c.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.document || 'Sin doc.'}</p>
                  </div>
                  {hasDebt && (
                    <span className="badge badge-warning" style={{ fontSize: '0.9rem' }}>{formatCOP(c.debts[0].subtotal)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Account Detail */}
      <div className="customers-detail card animate-fade-in" style={{ 
        alignSelf: 'start', 
        position: 'sticky', 
        top: '80px',
      }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn-icon mobile-only" 
              onClick={() => setShowDetail(false)}
              style={{ background: 'var(--bg-main)', borderRadius: '50%', display: 'flex', border: '1px solid var(--border)' }}
            >
              <FiArrowLeft size={20} />
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {selectedCustomer ? `Cuenta de ${selectedCustomer.name}` : 'Seleccione o cree un cliente'}
            </h2>
          </div>
          {selectedCustomer && role === 'ADMIN' && (
            <button 
              className="btn-icon" 
              onClick={handleDeleteCustomer} 
              disabled={loading}
              style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} 
              title="Eliminar Cliente"
            >
              <FiTrash2 size={20} />
            </button>
          )}
        </div>
        
        <div className="card-body" style={{ minHeight: '300px' }}>
          {selectedCustomer ? (
            <>
              {(!selectedCustomer.debts || selectedCustomer.debts.length === 0 || selectedCustomer.debts[0].subtotal === 0) ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  <p>Este cliente no tiene deudas pendientes.</p>
                  <button className="btn btn-primary" onClick={() => setIsFiadoOpen(true)} style={{ marginTop: '1rem' }}>
                    <FiPlus /> Fiar Artículo o Monto
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Artículos Fiados</h3>
                    <button className="btn btn-primary" onClick={() => setIsFiadoOpen(true)}>
                      <FiPlus size={16} /> Fiar Otro
                    </button>
                  </div>
                  
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    {selectedCustomer.debts[0].items.map((item, idx) => {
                      const isAbono = item.price < 0
                      const prodName = isAbono ? item.description : (item.productId 
                        ? inventory.find(i => i.id === item.productId)?.name || 'Item'
                        : item.description || 'Venta Libre')
                        
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <span style={{ fontWeight: '600', color: isAbono ? 'var(--success)' : 'inherit' }}>{isAbono ? '' : `${item.quantity}x `}</span>
                            <span style={{ color: isAbono ? 'var(--success)' : 'inherit' }}>{prodName}</span>
                          </div>
                          <span style={{ color: isAbono ? 'var(--success)' : 'inherit' }}>{formatCOP(item.price * item.quantity)}</span>
                        </div>
                      )
                    })}
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal:</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCOP(selectedCustomer.debts[0].subtotal)}</span>
                    </div>
                    {selectedCustomer.debts[0].subtotal > 0 && (
                      <>
                        <div style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                          <span>Recargo por Fiado (+5%):</span>
                          <span>{formatCOP(selectedCustomer.debts[0].subtotal * 0.05)}</span>
                        </div>
                        <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          <span>TOTAL A PAGAR:</span>
                          <span>{formatCOP(selectedCustomer.debts[0].subtotal * 1.05)}</span>
                        </div>
                      </>
                    )}
                    {selectedCustomer.debts[0].subtotal <= 0 && (
                       <div style={{ paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        <span>TOTAL A PAGAR:</span>
                        <span>$0,00</span>
                      </div>
                    )}
                  </div>

                  {role === 'ADMIN' ? (
                    <button className="btn btn-primary" onClick={() => setIsSettleModalOpen(true)} disabled={loading} style={{ width: '100%', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--success)' }}>
                      <FiCheckCircle size={20} />
                      {loading ? 'Saldando...' : 'SALDAR CUENTA (ADMIN)'}
                    </button>
                  ) : (
                    <div style={{ backgroundColor: 'var(--warning-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
                      <FiCheckCircle size={16} style={{ marginBottom: '-3px', marginRight: '4px' }}/>
                      Solo el Administrador puede saldar cuentas
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
              Aún no hay cliente seleccionado.
            </div>
          )}
        </div>
      </div>

      {isNewCustomerOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>Nuevo Cliente</h3>
              <button className="btn-icon" onClick={() => setIsNewCustomerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Nombre del Cliente</label>
                  <input className="input-control" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Cédula/Documento (Opcional)</label>
                  <input className="input-control" value={customerForm.document} onChange={e => setCustomerForm({...customerForm, document: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Teléfono/Celular (Opcional)</label>
                  <input className="input-control" type="tel" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {loading ? 'Creando...' : 'Crear Cliente'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isFiadoOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>Agregar Fiado</h3>
              <button className="btn-icon" onClick={() => setIsFiadoOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setFiadoMode('inventory')} 
                  style={{ background: 'none', border: 'none', fontWeight: fiadoMode === 'inventory' ? 'bold' : 'normal', color: fiadoMode === 'inventory' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1 }}
                >
                  Desde Inventario
                </button>
                <button 
                  type="button" 
                  onClick={() => setFiadoMode('generic')} 
                  style={{ background: 'none', border: 'none', fontWeight: fiadoMode === 'generic' ? 'bold' : 'normal', color: fiadoMode === 'generic' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1 }}
                >
                  Monto Manual
                </button>
                {role === 'ADMIN' && (
                  <button 
                    type="button" 
                    onClick={() => setFiadoMode('abono')} 
                    style={{ background: 'none', border: 'none', fontWeight: fiadoMode === 'abono' ? 'bold' : 'normal', color: fiadoMode === 'abono' ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1 }}
                  >
                    Abonar Saldo
                  </button>
                )}
              </div>

              <form onSubmit={handleAddFiado} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {fiadoMode === 'inventory' ? (
                  <>
                    <div className="input-group">
                      <label>Seleccionar Producto</label>
                      <select className="input-control" value={fiadoForm.productId} onChange={e => setFiadoForm({...fiadoForm, productId: e.target.value})} required>
                        <option value="" disabled>-- Elige del inventario --</option>
                        {inventory.map(prod => (
                          <option key={prod.id} value={prod.id} disabled={prod.stock < 1}>
                            {prod.name} ({formatCOP(prod.price)}) {prod.stock < 1 && '- Agotado'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Cantidad</label>
                      <input className="input-control" type="number" min="1" value={fiadoForm.quantity} onChange={e => setFiadoForm({...fiadoForm, quantity: Number(e.target.value)})} required />
                    </div>
                  </>
                ) : fiadoMode === 'generic' ? (
                  <>
                    <div className="input-group">
                      <label>Fecha del saldo</label>
                      <input className="input-control" type="text" placeholder="Ej. Sábado 11 de Abril" value={genericForm.description} onChange={e => setGenericForm({...genericForm, description: e.target.value})} required />
                    </div>
                    <div className="input-group">
                      <label>Monto Total ($)</label>
                      <input className="input-control" type="number" min="1" placeholder="Ej. 23500" value={genericForm.amount} onChange={e => setGenericForm({...genericForm, amount: e.target.value})} required />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Cantidad a Abonar ($)</label>
                      <input className="input-control" type="number" min="1" placeholder="Ej. 10000" value={abonoForm.amount} onChange={e => setAbonoForm({...abonoForm, amount: e.target.value})} required />
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                      Este monto se restará inmediatamente a la deuda acumulada de su cuenta de forma limpia.
                    </div>
                  </>
                )}
                
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {loading ? 'Registrando...' : 'Agregar a la cuenta'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Settle / Saldar Modal */}
      {isSettleModalOpen && selectedCustomer && selectedCustomer.debts[0] && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>Saldar Cuenta</h3>
              <button className="btn-icon" onClick={() => setIsSettleModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Monto Final con 5%:</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCOP(selectedCustomer.debts[0].subtotal * 1.05)}</p>
              </div>

              <form onSubmit={executeSettleDebt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Método de Pago</label>
                  <select className="input-control" value={settleForm.method} onChange={e => setSettleForm({...settleForm, method: e.target.value})} required>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Correo Electrónico (Opcional)</label>
                  <input className="input-control" type="email" placeholder="Para enviar factura..." value={settleForm.email} onChange={e => setSettleForm({...settleForm, email: e.target.value})} />
                </div>
                
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem', backgroundColor: 'var(--success)' }}>
                  {loading ? 'Procesando...' : 'CONFIRMAR PAGO Y ENVIAR'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .customers-layout {
          display: grid;
          grid-template-columns: minmax(300px, 1fr) 2fr;
          gap: 1.5rem;
          position: relative;
        }
        .mobile-only {
          display: none;
        }
        @media (max-width: 768px) {
          .customers-layout {
            grid-template-columns: 1fr;
            display: block;
          }
          .mobile-only {
            display: flex;
          }
          .customers-sidebar {
            display: ${showDetail ? 'none' : 'flex'} !important;
          }
          .customers-detail {
            display: ${showDetail ? 'block' : 'none'} !important;
            min-height: calc(100vh - 160px);
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  )
}
