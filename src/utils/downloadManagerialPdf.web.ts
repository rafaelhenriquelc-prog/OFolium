import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { MANAGERIAL_DISCLAIMER } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';
import {
  managerialPdfFileName,
  type ManagerialPdfInput,
  type ManagerialPdfResult,
} from '@/utils/managerialPdf';

const ORANGE: [number, number, number] = [255, 92, 0];
const INK: [number, number, number] = [17, 17, 17];
const MUTED: [number, number, number] = [107, 107, 118];
const CREAM: [number, number, number] = [255, 248, 243];

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY?: number } };

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function createManagerialPdf(input: ManagerialPdfInput): { doc: jsPDF; fileName: string } {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const companyName = input.companyName?.trim();

  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('OFolium — Demonstrativo gerencial', margin, 14);

  let cursor = 32;
  doc.setTextColor(...INK);
  if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const companyLines = doc.splitTextToSize(companyName, contentWidth) as string[];
    doc.text(companyLines, margin, cursor);
    cursor += companyLines.length * 6;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Competência: ${input.competenceLabel}`, margin, cursor);
  cursor += 5;
  doc.text(`Gerado em: ${formatGeneratedAt(input.generatedAt)}`, margin, cursor);
  cursor += 8;

  autoTable(doc, {
    startY: cursor,
    margin: { top: 16, right: margin, bottom: 18, left: margin },
    head: [['Funcionário', 'Cargo', 'Previsão']],
    body: input.rows.map((row) => [row.employeeName, row.role || '—', formatCurrency(row.forecast)]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      textColor: INK,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: ORANGE,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 52 },
      2: { cellWidth: 48, halign: 'right' },
    },
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didDrawPage: (data) => {
      if (data.pageNumber === 1) return;
      doc.setFillColor(...ORANGE);
      doc.rect(0, 0, pageWidth, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('OFolium — Demonstrativo gerencial', margin, 6.5);
    },
  });

  const tableBottom = (doc as PdfWithTable).lastAutoTable?.finalY ?? cursor;
  const disclaimerLines = doc.splitTextToSize(MANAGERIAL_DISCLAIMER, contentWidth - 8) as string[];
  const closingHeight = 14 + 8 + disclaimerLines.length * 4.5;
  let closingTop = tableBottom + 8;
  if (closingTop + closingHeight > pageHeight - 16) {
    doc.addPage();
    closingTop = 20;
  }

  doc.setFillColor(...CREAM);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, closingTop, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('Total geral previsto', margin + 4, closingTop + 7.6);
  doc.setTextColor(...ORANGE);
  doc.text(formatCurrency(input.totalForecast), margin + contentWidth - 4, closingTop + 7.6, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(disclaimerLines, margin, closingTop + 20);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(155, 155, 166);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return { doc, fileName: managerialPdfFileName(input.competence) };
}

export function downloadManagerialPdf(input: ManagerialPdfInput): ManagerialPdfResult {
  const { doc, fileName } = createManagerialPdf(input);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return { ok: true };
}
