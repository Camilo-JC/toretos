'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiChevronDown, FiChevronUp, FiSearch, FiShoppingBag, FiCalendar } from 'react-icons/fi'

export default function HistoryClient({ paidDebts }: { paidDebts: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(num)
  }

  const filteredHistory = paidDebts.filter(debt => 
    debt.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debt.customer.document?.includes(searchTerm)
  )

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* SEARCH BAR */}
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input 
          type="text"
          placeholder="Buscar factura por cliente o documento..."
          className="input-control"
          style={{ paddingLeft: '2.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'white' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* HISTORY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <FiSearch size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No se encontraron facturas en el historial.</p>
          </div>
        ) : (
          filteredHistory.map((debt) => (
            <div 
              key={debt.id} 
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)', 
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: expandedId === debt.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none'
              }}
            >
              <div 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer' 
                }}
                onClick={() => toggleExpand(debt.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: 'rgba(67, 56, 202, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <FiShoppingBag size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', color: 'white', marginBottom: '0.25rem', fontSize: '1.1rem' }}>{debt.customer.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiCalendar size={14} /> {format(new Date(debt.paidAt || debt.updatedAt), "d 'de' MMM, yyyy", { locale: es })}
                      </span>
                      <span>Total Pagado: <strong style={{ color: 'var(--success)' }}>{formatCOP(debt.total)}</strong></span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    LIQUIDADO
                  </span>
                  {expandedId === debt.id ? <FiChevronUp color="#9ca3af" /> : <FiChevronDown color="#9ca3af" />}
                </div>
              </div>

              {expandedId === debt.id && (
                <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#9ca3af', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalles de la compra</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {debt.items.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'white' }}>
                          <span>{item.quantity}x {item.description || item.product?.name || 'Artículo'}</span>
                          <span>{formatCOP(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      
                      <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9ca3af' }}>
                          <span>Subtotal acumulado:</span>
                          <span>{formatCOP(debt.subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ef4444' }}>
                          <span>Recargo por fiado (5%):</span>
                          <span>{formatCOP(debt.total - debt.subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginTop: '0.5rem' }}>
                          <span>Total Final:</span>
                          <span style={{ color: 'var(--success)' }}>{formatCOP(debt.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  )
}
