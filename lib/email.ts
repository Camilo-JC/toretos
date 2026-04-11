import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un correo electrónico de prueba o general.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: `"Los Toreto" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('[EMAIL_SENT]', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_ERROR]', error);
    return { success: false, error };
  }
}

/**
 * Plantilla para enviar el código de recuperación al administrador.
 */
export async function sendRecoveryCode(email: string, code: string) {
  return sendEmail({
    to: email,
    subject: 'Código de Recuperación - Los Toreto',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4338ca; text-align: center;">Control de Acceso - Los Toreto</h2>
        <p>Se ha solicitado un código para restablecer una contraseña en el sistema.</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Este código expirará en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
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
