'use client'

import { FiDownload } from 'react-icons/fi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DashboardActionsProps {
  metrics: {
    totalHistorial: number
    mesActual: number
    hoyEntradas: number
    dineroEnCalle: number
  }
}

export default function DashboardActions({ metrics }: DashboardActionsProps) {
  const downloadPDF = () => {
    const doc = new jsPDF()

    // 1. Logo (Recortado)
    try {
      doc.addImage('/icon.png', 'PNG', 15, 12, 25, 25)
    } catch (e) {
      console.error("Logo no encontrado", e)
    }

    // 2. Cabecera
    doc.setFontSize(24)
    doc.setTextColor(67, 56, 202) // Indigo
    doc.setFont('helvetica', 'bold')
    doc.text('Los Toreto', 45, 28)

    doc.line(15, 42, 195, 42)

    // 3. Tabla de Métricas
    const tableData = [
      ['Caja de Hoy (Ventas + Abonos)', `$ ${metrics.hoyEntradas.toLocaleString('es-CO')}`],
      ['Ventas Totales del Mes', `$ ${metrics.mesActual.toLocaleString('es-CO')}`],
      ['Dinero en la Calle (Fiados Pendientes)', `$ ${metrics.dineroEnCalle.toLocaleString('es-CO')}`],
      ['Ingresos Históricos Totales', `$ ${metrics.totalHistorial.toLocaleString('es-CO')}`]
    ]

    autoTable(doc, {
      startY: 50,
      head: [['Indicador Contable', 'Valor Acumulado ($)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      }
    })

    // 4. Notas Finales
    const finalY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Nota Importante:', 15, finalY)
    doc.setFontSize(9)
    doc.text('Este reporte consolida tanto los pagos totales por liquidación de cuentas como los abonos parciales realizados por los clientes.', 15, finalY + 6)
    doc.text('Los valores reflejan el saldo real de caja y la cartera pendiente de cobro al momento de la impresión.', 15, finalY + 11)

    // 5. Pie de página
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Sistema de Gestión Los Toreto - Reporte Oficial', 105, 285, { align: 'center' })

    doc.save(`Reporte_Contable_Toreto_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <button 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        backgroundColor: 'var(--primary)', 
        color: 'white', 
        padding: '0.75rem 1.5rem', 
        borderRadius: 'var(--radius)', 
        fontWeight: 'bold', 
        cursor: 'pointer', 
        border: 'none',
        boxShadow: 'var(--shadow)'
      }}
      onClick={downloadPDF}
    >
      Descargar reporte (PDF) <FiDownload />
    </button>
  )
}
