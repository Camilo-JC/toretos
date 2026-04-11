'use client'

import { useState, useEffect } from 'react'

export default function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [storeName, setStoreName] = useState(initialSettings.storeName)
  const [adminUsername, setAdminUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Trabajadores state
  const [workers, setWorkers] = useState<any[]>([])
  const [showNewWorker, setShowNewWorker] = useState(false)
  const [workerForm, setWorkerForm] = useState({ username: '', password: '' })
  const [editWorkerId, setEditWorkerId] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    const res = await fetch('/api/users')
    if (res.ok) {
      const data = await res.json()
      setWorkers(data.workers)
      setAdminUsername(data.adminUsername || 'admin')
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: any = { storeName, adminUsername }
    if (password) payload.password = password

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      alert('Configuración guardada.')
      setPassword('')
    } else {
      alert('Error guardando configuración')
    }
    setLoading(false)
  }

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerForm)
    })

    if (res.ok) {
      const { worker } = await res.json()
      setWorkers([...workers, worker])
      setShowNewWorker(false)
      setWorkerForm({ username: '', password: '' })
    } else {
      const data = await res.json()
      alert(data.error || 'Error')
    }
    setLoading(false)
  }

  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/users/${editWorkerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerForm)
    })

    if (res.ok) {
      setWorkers(workers.map(w => w.id === editWorkerId ? { ...w, username: workerForm.username } : w))
      setEditWorkerId(null)
      setWorkerForm({ username: '', password: '' })
    } else {
      alert('Error actualizando trabajador')
    }
    setLoading(false)
  }

  const handleDeleteWorker = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al trabajador ${name}? No podrá iniciar sesión.`)) return
    setLoading(true)
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setWorkers(workers.filter(w => w.id !== id))
    } else {
      alert('Error eliminando trabajador')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Configuración de Tienda</h2>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>Nombre de la Tienda</label>
                <input 
                  className="input-control" 
                  value={storeName} 
                  onChange={e => setStoreName(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label>Usuario del Administrador</label>
                <input 
                  className="input-control" 
                  value={adminUsername} 
                  onChange={e => setAdminUsername(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Cambiar Contraseña Admin (Opcional)</label>
                <input 
                  className="input-control" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Trabajadores</h2>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setShowNewWorker(true)
              setEditWorkerId(null)
              setWorkerForm({ username: '', password: '' })
            }}
          >
            + Añadir
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {workers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No hay trabajadores creados.</p>
          ) : (
            workers.map(w => (
              <div key={w.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '600' }}>{w.username}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} 
                    onClick={() => {
                      setWorkerForm({ username: w.username, password: '' })
                      setEditWorkerId(w.id)
                      setShowNewWorker(true)
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--danger)', color: 'white', border: 'none' }} 
                    onClick={() => handleDeleteWorker(w.id, w.username)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showNewWorker && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: 'bold' }}>{editWorkerId ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h3>
              <button className="btn-icon" onClick={() => setShowNewWorker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="card-body">
              <form onSubmit={editWorkerId ? handleUpdateWorker : handleCreateWorker} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Nombre de Usuario</label>
                  <input className="input-control" value={workerForm.username} onChange={e => setWorkerForm({...workerForm, username: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>{editWorkerId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label>
                  <input className="input-control" type="password" value={workerForm.password} onChange={e => setWorkerForm({...workerForm, password: e.target.value})} required={!editWorkerId} />
                </div>
                
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
