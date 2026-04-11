import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import SettingsClient from '@/app/dashboard/settings/SettingsClient'

export const revalidate = 0

export default async function SettingsPage() {
  const session = await getSession()
  const role = (session?.role as string) || 'WORKER'

  if (role !== 'ADMIN') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>No tienes acceso a esta sección.</div>
  }

  const settings = await prisma.settings.findFirst() || { storeName: 'Los Toreto', logoUrl: '' }
  
  return <SettingsClient initialSettings={settings} />
}
