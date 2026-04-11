import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const data = await request.json()
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      document: data.document || null,
      phone: data.phone || null
    }
  })
  return NextResponse.json(customer)
}
