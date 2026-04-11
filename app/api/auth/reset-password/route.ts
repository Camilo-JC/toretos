import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, code, newPassword } = await request.json()
    
    // Buscar al usuario
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || user.recoveryCode !== code) {
      return NextResponse.json({ error: 'Código inválido o usuario no encontrado' }, { status: 400 })
    }

    // Verificar expiración
    if (!user.recoveryExpires || new Date() > user.recoveryExpires) {
      return NextResponse.json({ error: 'El código ha expirado' }, { status: 400 })
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar usuario y limpiar campos de recuperación
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        recoveryCode: null,
        recoveryExpires: null
      }
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada con éxito' })
  } catch (error: any) {
    console.error('[RESET_PASSWORD_ERROR]', error)
    return NextResponse.json({ error: 'No se pudo restablecer la contraseña' }, { status: 500 })
  }
}
