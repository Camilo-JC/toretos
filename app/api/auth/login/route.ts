import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'

// Simple in-memory rate limiting
const attemptsMap = new Map<string, { count: number, lastAttempt: number }>()

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const limitKey = `${username}_${clientIp}`

    if (!username || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    // Check for lockout
    const attempt = attemptsMap.get(limitKey)
    if (attempt && attempt.count >= 5) {
      const waitTime = 2 * 60 * 1000 // 2 mins
      if (Date.now() - attempt.lastAttempt < waitTime) {
        const remaining = Math.ceil((waitTime - (Date.now() - attempt.lastAttempt)) / 60000)
        return NextResponse.json({ error: `Demasiados intentos. Bloqueado por ${remaining} minutos.` }, { status: 429 })
      } else {
        attemptsMap.delete(limitKey) // Reset after wait time
      }
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      // Record failed attempt even for non-existent users
      const current = attemptsMap.get(limitKey) || { count: 0, lastAttempt: 0 }
      attemptsMap.set(limitKey, { count: current.count + 1, lastAttempt: Date.now() })
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    
    if (!isValid) {
      const current = attemptsMap.get(limitKey) || { count: 0, lastAttempt: 0 }
      attemptsMap.set(limitKey, { count: current.count + 1, lastAttempt: Date.now() })
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Success: Reset attempts
    attemptsMap.delete(limitKey)

    await createSession(user.id, user.role, user.username)

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role, name: user.name } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
