import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
  const testEmail = process.env.ADMIN_EMAIL || 'camilojc1725@gmail.com';
  
  console.log('[DEBUG_EMAIL] Iniciando prueba API...');
  
  const result = await sendEmail({
    to: testEmail,
    subject: 'Prueba de API - Los Toreto 🚀',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #4338ca; border-radius: 10px;">
        <h1 style="color: #4338ca;">¡Conexión Exitosa!</h1>
        <p>Este correo confirma que la <strong>API de Brevo</strong> está funcionando correctamente en tu sistema.</p>
        <p>Fecha de la prueba: ${new Date().toLocaleString('es-CO')}</p>
        <hr>
        <p style="font-size: 12px; color: #6b7280;">Sistema de Gestión Los Toreto v3.1 (API Mode)</p>
      </div>
    `,
  });

  if (result.success) {
    return NextResponse.json({
      status: 'success',
      message: `Correo de prueba enviado a ${testEmail}`,
      details: result.messageId
    });
  } else {
    return NextResponse.json({
      status: 'error',
      message: 'Fallo al enviar correo desde la API',
      error: result.error
    }, { status: 500 });
  }
}
