import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendRecoveryCode } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    
    // Buscar al usuario que intenta recuperar su clave
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      // Por seguridad, devolvemos éxito aunque no exista el usuario (evitar enumeración)
      // pero no enviamos correo si no lo encontramos o no es una cuenta válida.
      return NextResponse.json({ success: true, message: 'Si el usuario existe, se ha enviado un código.' })
    }

    // Generar un código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Guardar el código en la base de datos con expiración (15 minutos)
    const expires = new Date(Date.now() + 15 * 60 * 1000)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        recoveryCode: code,
        recoveryExpires: expires
      }
    })

    // Enviar el correo al administrador (Camilo)
    const adminEmail = process.env.ADMIN_EMAIL || 'camilojc1725@gmail.com'
    await sendRecoveryCode(adminEmail, code, user.username)

    return NextResponse.json({ 
      success: true, 
      message: 'Código enviado al correo del administrador.' 
    })
  } catch (error: any) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return NextResponse.json({ error: 'No se pudo procesar la solicitud' }, { status: 500 })
  }
}
