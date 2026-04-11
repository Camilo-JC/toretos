'use client'

import { useRouter, usePathname } from 'next/navigation'
import { FiHome, FiBox, FiUsers, FiSettings, FiLogOut, FiFileText } from 'react-icons/fi'

export default function Navigation({ role, username }: { role: string, username: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const navItems = [
    { label: 'Inicio', path: '/dashboard', icon: FiHome },
    { label: 'Inventario', path: '/dashboard/inventory', icon: FiBox },
    { label: 'Fiados', path: '/dashboard/customers', icon: FiUsers },
    { label: 'Historial', path: '/dashboard/history', icon: FiFileText },
  ]

  if (role === 'ADMIN') {
    navItems.push({ label: 'Config', path: '/dashboard/settings', icon: FiSettings })
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
          return (
            <button 
              key={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Header */}
      <header className="dashboard-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
              <img src="/icon.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
              <span>Los Toreto</span>
              {role === 'ADMIN' && <span className="badge badge-success" style={{ fontSize: '10px' }}>ADMIN</span>}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="desktop-nav">
              {navItems.map(item => {
                const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
                return (
                  <button 
                    key={item.path}
                    className={`desktop-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => router.push(item.path)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'white', fontWeight: '500' }} className="hide-mobile">Hola, {username}</span>
            <button className="btn-icon" onClick={handleLogout} title="Cerrar sesión" style={{ color: 'white', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', padding: '8px' }}>
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <style jsx>{`
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-header);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-around;
          padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom));
          z-index: 100;
        }

        .desktop-nav {
          display: none;
          gap: 1rem;
        }

        .desktop-nav-item {
          background: none;
          border: none;
          color: #9ca3af;
          font-weight: 500;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: var(--radius-sm);
        }

        .desktop-nav-item:hover {
          color: white;
          background: rgba(67, 56, 202, 0.1);
        }

        .desktop-nav-item.active {
          color: white;
          background: var(--primary);
        }
        
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 0.75rem;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: var(--radius-sm);
        }
        
        .mobile-nav-item.active {
          color: white;
          background: rgba(67, 56, 202, 0.2);
        }

        .dashboard-header {
          position: sticky;
          top: 0;
          height: 70px;
          background: var(--bg-header);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-bottom: 1px solid var(--border);
          z-index: 90;
        }
        
        @media (min-width: 768px) {
          .mobile-nav {
            display: none;
          }
          .desktop-nav {
            display: flex;
          }
        }

        @media (max-width: 640px) {
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
