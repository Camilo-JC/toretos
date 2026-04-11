/**
 * Envia un correo electrónico usando la API REST v3 de Brevo.
 * Mucho más confiable para entornos serverless como Vercel.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.BREVO_API_KEY || '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';
  const senderEmail = process.env.SMTP_USER || 'camilojc1725@gmail.com';

  console.log(`[BREVO_API_ATTEMPT] Destinatario: ${to}, Asunto: ${subject}`);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Los Toreto', email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[BREVO_API_SUCCESS] ID:', data.messageId);
      return { success: true, messageId: data.messageId };
    } else {
      console.error('[BREVO_API_ERROR] Detalles:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('[BREVO_API_FATAL] Error de red:', error);
    return { success: false, error };
  }
}

/**
 * Plantilla para enviar el código de recuperación al administrador.
 */
export async function sendRecoveryCode(email: string, code: string, targetUsername: string) {
  return sendEmail({
    to: email,
    subject: `Recuperar Acceso: @${targetUsername} - Los Toreto`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4338ca; text-align: center;">Control de Acceso - Los Toreto</h2>
        <p>El usuario <strong>@${targetUsername}</strong> ha solicitado un código para restablecer su contraseña.</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Si tú no autorizaste este cambio, no compartas este código con nadie.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Seguridad Los Toreto v3.0</p>
      </div>
    `,
  });
}

/**
 * Plantilla para enviar el recibo de pago al cliente.
 */
export async function sendReceipt(email: string, customerName: string, amount: number, details: any) {
  const formattedAmount = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  
  return sendEmail({
    to: email,
    subject: `Recibo de Pago - Los Toreto - ${customerName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #111827; margin: 0;">Los Toreto</h1>
          <p style="color: #6b7280; margin: 5px 0;">Gestión de Tienda y Fiados</p>
        </div>
        
        <h3 style="border-bottom: 2px solid #4338ca; padding-bottom: 10px;">Comprobante de Pago</h3>
        <p>Hola <strong>${customerName}</strong>,</p>
        <p>Tu deuda ha sido saldada exitosamente. Aquí tienes los detalles de la transacción:</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #6b7280;">Monto Pagado:</td>
              <td style="text-align: right; font-weight: bold; color: #059669;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="color: #6b7280;">Fecha:</td>
              <td style="text-align: right;">${new Date().toLocaleDateString('es-CO')}</td>
            </tr>
            <tr>
              <td style="color: #6b7280;">ID Transacción:</td>
              <td style="text-align: right; font-size: 10px; color: #9ca3af;">${details.id}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #4b5563;">Gracias por tu cumplimiento y por confiar en nosotros.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>© ${new Date().getFullYear()} Los Toreto - ¡Vuelve pronto!</p>
        </div>
      </div>
    `,
  });
}
