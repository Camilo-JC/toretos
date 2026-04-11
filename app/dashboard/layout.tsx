import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/')
  }

  return (
    <div style={{ paddingBottom: '70px' }}>
      <Navigation role={session.role as string} username={session.username as string} />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        {children}
      </div>
    </div>
  )
}
