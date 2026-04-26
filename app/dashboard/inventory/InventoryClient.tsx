'use client'

import { useState } from 'react'
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  unit: string
}

export default function InventoryClient({ initialProducts, role }: { initialProducts: Product[], role: string }) {
  const [products, setProducts] = useState(initialProducts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({ id: '', name: '', description: '', price: 0, stock: 0, unit: 'UNIDAD' })

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(num)
  }

  const openModal = (product?: Product) => {
    if (product) {
      setFormData({ 
        id: product.id, 
        name: product.name, 
        description: product.description || '', 
        price: product.price, 
        stock: product.stock,
        unit: product.unit || 'UNIDAD'
      })
    } else {
      setFormData({ id: '', name: '', description: '', price: 0, stock: 0, unit: 'UNIDAD' })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const url = formData.id ? `/api/products/${formData.id}` : `/api/products`
    const method = formData.id ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      const savedProduct = await res.json()
      if (formData.id) {
        setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p))
      } else {
        setProducts([savedProduct, ...products])
      }
      setIsModalOpen(false)
    } else {
      alert('Error guardando producto')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts(products.filter(p => p.id !== id))
    } else {
      alert('Error eliminando producto')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header animate-fade-in">
        <div className="page-header-info">
          <h1>Inventario</h1>
          <p>Gestiona los productos, el stock y los precios de venta de tu tienda.</p>
        </div>
        {role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => openModal()} style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
            <FiPlus size={20} /> Nuevo Producto
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '0.75rem' 
      }}>
        {products.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>No hay productos registrados.</p>
        ) : (
          products.map(p => (
            <div key={p.id} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', height: '100%', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: '1.2' }}>{p.name}</h3>
                </div>
                
                <span className={`badge ${p.stock > 10 ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}`} style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                  Stock: {p.stock} {p.unit}
                </span>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', flexGrow: 1, margin: '0.25rem 0' }}>
                  {p.description || 'Sin desc.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {formatCOP(p.price).split(',')[0]} <small style={{ fontSize: '0.65rem' }}>/ {p.unit}</small>
                  </span>
                  
                  {role === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-icon" onClick={() => openModal(p)} style={{ color: 'var(--text-secondary)', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px' }}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px' }}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal / Dialog simplificado */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Nombre</label>
                  <input className="input-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Descripción</label>
                  <input className="input-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Precio por {formData.unit}</label>
                    <input className="input-control" type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                  </div>
                  <div className="input-group">
                    <label>Unidad de Medida</label>
                    <select className="input-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required>
                      <option value="UNIDAD">UNIDAD</option>
                      <option value="LB">LIBRA (LB)</option>
                      <option value="KG">KILO (KG)</option>
                      <option value="ARROBA">ARROBA (@)</option>
                      <option value="BTO">BULTO (BTO)</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Stock Actual ({formData.unit})</label>
                  <input className="input-control" type="number" step="0.01" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
