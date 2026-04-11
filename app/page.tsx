'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (res.ok) {
        // Simular carga premium antes de redireccionar
        setTimeout(() => {
          router.push('/dashboard')
        }, 2500)
      } else {
        setError(data.error || 'Autenticación fallida')
        setLoading(false)
      }
    } catch (err) {
      setError('Problema de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* LOADING OVERLAY PREMIUM */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-logo-container">
            {/* El borde circular que se mueve */}
            <div className="spinning-border"></div>
            <div className="loading-logo-inner">
              <img src="/icon-512.png" alt="Loading Logo" className="loading-logo-img" />
            </div>
          </div>
          <p className="loading-text">Verificando Credenciales...</p>
        </div>
      )}

      <div className="login-card-container">
        <div className="card login-card animate-slide-up">
          <div className="card-header" style={{ justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem 1.5rem 1rem' }}>
            <div className="login-logo-wrapper">
              <img src="/icon-512.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '12px', boxShadow: '0 0 20px rgba(67, 56, 202, 0.3)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', marginBottom: '0.25rem', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Los Toreto</h1>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sistema de Tienda y Fiados</p>
            </div>
          </div>

          <div className="card-body" style={{ padding: '1.5rem 2rem 2.5rem' }}>
            {error && (
              <div className="error-alert animate-shake">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="input-group">
                <label htmlFor="username" style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input 
                    id="username"
                    className="input-control login-input" 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Tu usuario"
                    disabled={loading}
                    required 
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
              
              <div className="input-group">
                <label htmlFor="password" style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input 
                    id="password"
                    className="input-control login-input" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required 
                    style={{ paddingLeft: '40px', paddingRight: '45px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? 'Protegiendo acceso...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>
        <p style={{ marginTop: '2rem', color: '#4b5563', fontSize: '0.75rem', textAlign: 'center' }}>
          Seguridad de Grado Militar Activada • Los Toreto v2.0
        </p>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #0b0f19;
          background-image: radial-gradient(circle at top right, rgba(67, 56, 202, 0.15), transparent),
                            radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.1), transparent);
        }

        .login-card-container {
          width: 100%;
          maxWidth: 420px;
          padding: 1rem;
        }

        .login-card {
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-input {
          background: rgba(31, 41, 55, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: white !important;
          height: 50px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .login-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(67, 56, 202, 0.2);
          background: rgba(31, 41, 55, 0.8) !important;
        }

        .login-btn {
          height: 50px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          background: linear-gradient(135deg, var(--primary) 0%, #4338ca 100%);
          border: none;
          box-shadow: 0 10px 15px -3px rgba(67, 56, 202, 0.4);
          transition: all 0.3s ease;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(67, 56, 202, 0.5);
        }

        .error-alert {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          border-left: 4px solid #ef4444;
          font-weight: 500;
        }

        /* LOADING OVERLAY ANIMATIONS */
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(3, 7, 18, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(10px);
        }

        .loading-logo-container {
          position: relative;
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinning-border {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(from 0deg, var(--primary), #10b981, var(--primary));
          animation: rotate-border 2s linear infinite;
          mask: radial-gradient(circle, transparent 65%, black 66%);
          -webkit-mask: radial-gradient(circle, transparent 65%, black 66%);
        }

        @keyframes rotate-border {
          to { transform: rotate(360deg); }
        }

        .loading-logo-inner {
          position: relative;
          width: 140px;
          height: 140px;
          background: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(67, 56, 202, 0.5);
        }

        .loading-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(1.2);
        }

        .loading-text {
          margin-top: 2rem;
          color: white;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 0.875rem;
          animation: text-glow 2s ease-in-out infinite alternate;
        }

        @keyframes text-glow {
          from { opacity: 0.5; text-shadow: 0 0 0px #4338ca; }
          to { opacity: 1; text-shadow: 0 0 10px #4338ca, 0 0 20px #10b981; }
        }

        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  )
}
