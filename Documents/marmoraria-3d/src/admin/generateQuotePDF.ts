import { jsPDF } from 'jspdf';

type SnapshotComponent = {
  enabled?: boolean;
  height?: number | null;
  width?: number | null;
  centerX?: number | null;
  type?: string | null;
};

type ConfigurationSnapshot = {
  countertop?: {
    width?: number | null;
    depth?: number | null;
    thickness?: number | null;
    stoneName?: string | null;
    stoneId?: string | null;
    totalPrice?: number | null;
  };
  components?: {
    backsplashRear?: SnapshotComponent;
    backsplashLeft?: SnapshotComponent;
    backsplashRight?: SnapshotComponent;
    skirtFront?: SnapshotComponent;
    skirtRear?: SnapshotComponent;
    skirtLeft?: SnapshotComponent;
    skirtRight?: SnapshotComponent;
    wetArea?: SnapshotComponent;
    sink?: SnapshotComponent;
    cooktop?: SnapshotComponent;
  };
  pricing?: {
    total?: number | null;
    components?: Array<{
      label?: string;
      name?: string;
      price?: number;
    }>;
  };
};

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

function fmtNumber(value: number | null | undefined, suffix: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}${suffix}`;
}

type QuoteInfo = {
  id: string;
  customerName: string;
  customerPhone: string;
  city?: string | null;
  totalPrice: number;
  createdAt: string;
};

function addHeader(doc: jsPDF, y: number): number {
  doc.setFontSize(18);
  doc.setTextColor(44, 41, 36);
  doc.text('Marmoraria 3D', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(120, 113, 107);
  doc.text('Orçamento de tampo sob medida', 20, y);
  y += 4;
  doc.text('contato@marmoraria3d.com.br', 20, y);
  return y + 8;
}

function addDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(220, 215, 205);
  doc.line(20, y, 190, y);
  return y + 6;
}

export function generateQuotePDF(
  quote: QuoteInfo,
  snapshot: ConfigurationSnapshot | null,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;

  // Cabeçalho
  y = addHeader(doc, y);
  y = addDivider(doc, y);

  // Info do pedido
  doc.setFontSize(11);
  doc.setTextColor(44, 41, 36);
  doc.text(`Orçamento #${quote.id.slice(0, 8).toUpperCase()}`, 20, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(100, 95, 90);
  doc.text(`Data: ${fmtDate(quote.createdAt)}`, 20, y);
  y += 8;

  // Cliente
  doc.setFontSize(12);
  doc.setTextColor(44, 41, 36);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.customerName, 20, y);
  y += 5;
  doc.setTextColor(100, 95, 90);
  doc.text(`Telefone: ${quote.customerPhone}`, 20, y);
  if (quote.city) {
    y += 5;
    doc.text(`Cidade: ${quote.city}`, 20, y);
  }
  y += 10;

  // Se não tem snapshot 3D, mostra resumo simples
  if (!snapshot) {
    doc.setFontSize(12);
    doc.setTextColor(44, 41, 36);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Valor total: ${fmtCurrency(quote.totalPrice)}`, 20, y);
    y += 14;
    addFooter(doc, y);
    doc.save(`orcamento-${quote.id.slice(0, 8)}.pdf`);
    return;
  }

  // Projeto 3D
  const ct = snapshot.countertop ?? {};
  const pricing = snapshot.pricing ?? {};
  const projectTotal = pricing.total ?? ct.totalPrice ?? quote.totalPrice;

  doc.setFontSize(12);
  doc.setTextColor(44, 41, 36);
  doc.setFont('helvetica', 'bold');
  doc.text('Projeto 3D', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Dimensões
  const width = fmtNumber(ct.width, 'm');
  const depth = fmtNumber(ct.depth, 'm');
  const thick = fmtNumber(ct.thickness, 'cm');
  doc.setTextColor(60, 55, 50);
  doc.text(`Medidas: ${width} × ${depth} × ${thick}`, 20, y);
  y += 5;

  // Pedra
  doc.text(`Pedra: ${ct.stoneName ?? 'Não informada'}`, 20, y);
  y += 5;

  // Área
  if (typeof ct.width === 'number' && typeof ct.depth === 'number') {
    const area = ct.width * ct.depth;
    doc.text(`Área calculada: ${area.toFixed(2)} m²`, 20, y);
    y += 5;
  }
  y += 5;

  // Componentes
  const comps = snapshot.components ?? {};
  const activeComponents: string[] = [];

  if (comps.backsplashRear?.enabled) activeComponents.push(`Frontão traseiro (${fmtNumber(comps.backsplashRear.height, 'cm')})`);
  if (comps.backsplashLeft?.enabled) activeComponents.push(`Frontão esquerdo (${fmtNumber(comps.backsplashLeft.height, 'cm')})`);
  if (comps.backsplashRight?.enabled) activeComponents.push(`Frontão direito (${fmtNumber(comps.backsplashRight.height, 'cm')})`);
  if (comps.skirtFront?.enabled) activeComponents.push(`Saia frontal (${fmtNumber(comps.skirtFront.height, 'cm')})`);
  if (comps.skirtLeft?.enabled) activeComponents.push(`Saia esquerda (${fmtNumber(comps.skirtLeft.height, 'cm')})`);
  if (comps.skirtRight?.enabled) activeComponents.push(`Saia direita (${fmtNumber(comps.skirtRight.height, 'cm')})`);
  if (comps.wetArea?.enabled) {
    const w = fmtNumber(comps.wetArea.width, 'm');
    activeComponents.push(`Área molhada (largura ${w})`);
  }
  if (comps.sink?.enabled) {
    activeComponents.push(`Cuba (${comps.sink.type ?? 'recorte'})`);
  }
  if (comps.cooktop?.enabled) {
    activeComponents.push(`Cooktop (${comps.cooktop.type ?? 'recorte'})`);
  }

  if (activeComponents.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(44, 41, 36);
    doc.setFont('helvetica', 'bold');
    doc.text('Componentes', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 55, 50);
    for (const comp of activeComponents) {
      doc.text(`• ${comp}`, 24, y);
      y += 5;
    }
    y += 5;
  }

  // Financeiro
  y = addDivider(doc, y);
  doc.setFontSize(12);
  doc.setTextColor(44, 41, 36);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo financeiro', 20, y);
  y += 7;

  const components = pricing.components ?? [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (components.length > 0) {
    for (const c of components) {
      const label = c.label ?? c.name ?? 'Item';
      const price = typeof c.price === 'number' ? fmtCurrency(c.price) : '—';
      doc.setTextColor(60, 55, 50);
      doc.text(label, 20, y);
      doc.text(price, 190, y, { align: 'right' });
      y += 5;
    }
    y += 3;
  }

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(44, 41, 36);
  doc.text('TOTAL', 20, y);
  doc.text(fmtCurrency(projectTotal), 190, y, { align: 'right' });
  y += 12;

  addFooter(doc, y);
  doc.save(`orcamento-${quote.id.slice(0, 8)}.pdf`);
}

function addFooter(doc: jsPDF, y: number): void {
  const pageHeight = doc.internal.pageSize.height;
  const footerY = Math.max(y + 4, pageHeight - 25);

  doc.setDrawColor(220, 215, 205);
  doc.line(20, footerY, 190, footerY);

  doc.setFontSize(8);
  doc.setTextColor(140, 135, 130);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Orçamento sujeito à conferência técnica e disponibilidade da pedra.',
    20,
    footerY + 6,
  );
  doc.text(
    'Marmoraria 3D — Todos os direitos reservados.',
    20,
    footerY + 12,
  );
}
