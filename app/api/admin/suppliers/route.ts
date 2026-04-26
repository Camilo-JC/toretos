import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(suppliers)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const data = await request.json()
  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      contact: data.contact || null,
      phone: data.phone || null,
      email: data.email || null
    }
  })
  return NextResponse.json(supplier)
}
