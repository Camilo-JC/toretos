import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export const generateReceiptPDF = (customer: any, debt: any, settleInfo: any = {}) => {
  const doc = new jsPDF()
  
  // Función para agregar logo y contenido
  const addContent = () => {
    // Logo (Recortado)
    try {
      doc.addImage('/icon.png', 'PNG', 15, 10, 25, 25)
    } catch (e) {
      console.error("No se pudo cargar el logo en el PDF", e)
    }

    // Cabecera
    doc.setFontSize(24)
    doc.setTextColor(67, 56, 202) // Indigo
    doc.setFont('helvetica', 'bold')
    doc.text('Los Toreto', 45, 25)

    // Información del Cliente
    doc.setDrawColor(200, 200, 200)
    doc.line(15, 45, 195, 45)
    
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text('FACTURA DE VENTA / COMPROBANTE', 15, 55)
    
    doc.setFontSize(10)
    const receiptNo = (debt.id || 'N/A').toUpperCase().substring(0, 8)
    doc.text(`N° Recibo: ${receiptNo}`, 140, 55)
    doc.text(`Fecha: ${format(new Date(debt.paidAt), 'dd/MM/yyyy HH:mm')}`, 15, 65)
    doc.text(`Cliente: ${customer.name}`, 15, 72)
    doc.text(`Método: ${settleInfo.method || 'Efectivo'}`, 140, 72)

    // Tabla de Contenido
    doc.setFillColor(243, 244, 246)
    doc.rect(15, 80, 180, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Cant.', 20, 85)
    doc.text('Descripción del Artículo / Abono', 40, 85)
    doc.text('Subtotal', 165, 85)

    let y = 95
    doc.setFont('helvetica', 'normal')
    debt.items.forEach((item: any) => {
      const isAbono = item.price < 0
      const prodName = isAbono ? 'PAGO PARCIAL / ABONO' : (item.description || 'Artículo de Inventario')

      doc.text(`${item.quantity}`, 20, y)
      doc.text(prodName, 40, y)
      doc.text(`$${Math.abs(item.price * item.quantity).toLocaleString('es-CO')}`, 165, y)
      
      if (isAbono) {
        doc.setFontSize(8)
        doc.setTextColor(16, 185, 129)
        doc.text('(Crédito a favor)', 40, y + 4)
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
      }
      
      y += 10
      if (y > 270) { doc.addPage(); y = 20; }
    })

    // Totales
    doc.line(15, y, 195, y)
    y += 10
    
    doc.setFontSize(11)
    doc.text('Subtotal Neto:', 130, y)
    doc.text(`$${debt.subtotal.toLocaleString('es-CO')}`, 165, y)
    y += 8

    doc.setTextColor(239, 68, 68)
    doc.text('Recargo Fiado (5%):', 130, y)
    doc.text(`$${(debt.subtotal * 0.05).toLocaleString('es-CO')}`, 165, y)
    y += 12

    doc.setFontSize(14)
    doc.setTextColor(67, 56, 202)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL A PAGAR:', 90, y)
    doc.text(`$${debt.total.toLocaleString('es-CO')}`, 165, y)

    // Footer
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'italic')
    doc.text('Gracias por su compra en Los Toreto. ¡Vuelva pronto!', 105, 285, { align: 'center' })

    const fileName = `Factura_Toreto_${customer.name.replace(/\s+/g, '_')}.pdf`
    doc.save(fileName)
  }

  addContent()
}
