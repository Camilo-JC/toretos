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
      {/* Mobile Bottom Navigation (iPhone/Android) */}
      <nav className="mobile-nav glass">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
          return (
            <button
              key={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              <div className="icon-wrapper">
                <Icon size={22} />
              </div>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Header (Desktop/Tablet) */}
      <header className="dashboard-header glass">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <div style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', letterSpacing: '-0.02em' }} onClick={() => router.push('/dashboard')}>
              <img src="/icon-512.png" alt="Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
              <span className="hide-tablet">Los Toreto</span>
              {role === 'ADMIN' && <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>ADMIN</span>}
            </div>

            {/* Desktop/Tablet Dock Navigation */}
            <nav className="desktop-nav">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
                return (
                  <button
                    key={item.path}
                    className={`desktop-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => router.push(item.path)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="user-profile hide-mobile">
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '600' }}>{username}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <style jsx>{`
        .mobile-nav {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          border-radius: 24px;
          display: flex;
          justify-content: space-around;
          padding: 0.75rem 0.5rem;
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
          z-index: 1000;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .desktop-nav {
          display: none;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px;
          border-radius: 14px;
          gap: 4px;
          border: 1px solid var(--border);
        }

        .desktop-nav-item {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          padding: 0.6rem 1rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .desktop-nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
        }

        .desktop-nav-item.active {
          color: white;
          background: var(--primary);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
        
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.5rem;
          flex: 1;
          cursor: pointer;
          transition: all 0.25s ease;
          border-radius: 16px;
        }

        .icon-wrapper {
          padding: 8px;
          border-radius: 12px;
          display: flex;
          transition: all 0.2s ease;
        }
        
        .mobile-nav-item.active {
          color: var(--primary);
        }

        .mobile-nav-item.active .icon-wrapper {
          background: var(--primary-light);
          transform: translateY(-4px);
        }

        .dashboard-header {
          position: sticky;
          top: 0;
          height: 70px;
          z-index: 900;
        }

        .logout-btn {
          background: var(--danger-light);
          color: var(--danger);
          border: 1px solid var(--danger-light);
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          display: flex;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: var(--danger);
          color: white;
        }
        
        @media (min-width: 768px) {
          .mobile-nav {
            display: none;
          }
          .desktop-nav {
            display: flex;
          }
        }

        @media (max-width: 1024px) {
          .hide-tablet {
            display: none;
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
