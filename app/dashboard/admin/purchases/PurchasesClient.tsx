'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiTruck, FiCalendar, FiPackage, FiUser, FiInfo } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Product { id: string; name: string; unit: string; stock: number; price: number }
interface Supplier { id: string; name: string; contact?: string; phone?: string }
interface Purchase { 
  id: string; 
  product: Product; 
  supplier: Supplier; 
  quantity: number; 
  unitCost: number; 
  totalCost: number; 
  date: string;
}

export default function PurchasesClient({ 
  initialPurchases, 
  suppliers: initialSuppliers, 
  products 
}: { 
  initialPurchases: Purchase[], 
  suppliers: Supplier[], 
  products: Product[] 
}) {
  const [purchases, setPurchases] = useState(initialPurchases)
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [purchaseForm, setPurchaseForm] = useState({ 
    productId: '', 
    supplierId: '', 
    quantity: 0, 
    unitCost: 0, 
    date: format(new Date(), 'yyyy-MM-dd') 
  })

  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', email: '' })

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num)
  }

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierForm)
    })
    if (res.ok) {
      const saved = await res.json()
      setSuppliers([...suppliers, saved])
      setIsSupplierModalOpen(false)
      setSupplierForm({ name: '', contact: '', phone: '', email: '' })
    } else {
      alert('Error creando proveedor')
    }
    setLoading(false)
  }

  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseForm)
    })
    if (res.ok) {
      const saved = await res.json()
      // Refresh purchases list
      const resP = await fetch('/api/admin/purchases')
      const updatedP = await resP.json()
      setPurchases(updatedP)
      setIsPurchaseModalOpen(false)
      setPurchaseForm({ productId: '', supplierId: '', quantity: 0, unitCost: 0, date: format(new Date(), 'yyyy-MM-dd') })
    } else {
      const err = await res.json()
      alert(err.error || 'Error registrando compra')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header animate-fade-in">
        <div className="page-header-info">
          <h1>Compras a Proveedores</h1>
          <p>Registra la mercancía adquirida y mantén el control de tus proveedores.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsSupplierModalOpen(true)}>
            <FiUser /> Nuevo Proveedor
          </button>
          <button className="btn btn-primary" onClick={() => setIsPurchaseModalOpen(true)}>
            <FiPlus /> Registrar Compra
          </button>
        </div>
      </div>

      <div className="card animate-fade-in">
        <div className="card-header">
          <h3 style={{ fontWeight: 'bold' }}>Historial de Adquisiciones</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <th style={{ padding: '1rem' }}>FECHA</th>
                <th style={{ padding: '1rem' }}>PRODUCTO</th>
                <th style={{ padding: '1rem' }}>PROVEEDOR</th>
                <th style={{ padding: '1rem' }}>CANTIDAD</th>
                <th style={{ padding: '1rem' }}>COSTO TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay compras registradas.</td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem' }}>{format(new Date(p.date), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.product.name}</td>
                    <td style={{ padding: '1rem' }}>{p.supplier.name}</td>
                    <td style={{ padding: '1rem' }}>{p.quantity} {p.product.unit}</td>
                    <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>{formatCOP(p.totalCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL COMPRA */}
      {isPurchaseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>Registrar Compra</h3>
              <button className="btn-icon" onClick={() => setIsPurchaseModalOpen(false)}>✕</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleRegisterPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Producto Adquirido</label>
                  <select className="input-control" value={purchaseForm.productId} onChange={e => setPurchaseForm({...purchaseForm, productId: e.target.value})} required>
                    <option value="" disabled>-- Selecciona --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Proveedor</label>
                  <select className="input-control" value={purchaseForm.supplierId} onChange={e => setPurchaseForm({...purchaseForm, supplierId: e.target.value})} required>
                    <option value="" disabled>-- Selecciona --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Cantidad</label>
                    <input className="input-control" type="number" step="0.01" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: Number(e.target.value)})} required />
                  </div>
                  <div className="input-group">
                    <label>Costo Unitario ($)</label>
                    <input className="input-control" type="number" value={purchaseForm.unitCost} onChange={e => setPurchaseForm({...purchaseForm, unitCost: Number(e.target.value)})} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Fecha de Compra</label>
                  <input className="input-control" type="date" value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} required />
                </div>
                <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.8rem' }}>
                  <FiInfo style={{ marginRight: '0.5rem' }} />
                  Esto sumará <strong>{purchaseForm.quantity}</strong> unidades al stock del producto automáticamente.
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Procesando...' : 'Guardar Compra'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROVEEDOR */}
      {isSupplierModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>Nuevo Proveedor</h3>
              <button className="btn-icon" onClick={() => setIsSupplierModalOpen(false)}>✕</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Nombre del Proveedor</label>
                  <input className="input-control" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required placeholder="Ej: Arroz Diana S.A." />
                </div>
                <div className="input-group">
                  <label>Contacto (Persona)</label>
                  <input className="input-control" value={supplierForm.contact} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} placeholder="Ej: Juan Pérez" />
                </div>
                <div className="input-group">
                  <label>Teléfono</label>
                  <input className="input-control" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} placeholder="Ej: 321..." />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Guardando...' : 'Registrar Proveedor'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
