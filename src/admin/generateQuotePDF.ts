import { jsPDF } from 'jspdf';

type QuoteInfo = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  city?: string | null;
  totalPrice: number;
  createdAt: string;
};

type SComp = { enabled?: boolean; height?: number | null; width?: number | null; centerX?: number | null; type?: string | null };
type Snapshot = {
  countertop?: { width?: number | null; depth?: number | null; thickness?: number | null; stoneName?: string | null; stoneId?: string | null; pricePerM2?: number | null; totalPrice?: number | null };
  components?: { backsplashRear?: SComp; backsplashLeft?: SComp; backsplashRight?: SComp; skirtFront?: SComp; skirtRear?: SComp; skirtLeft?: SComp; skirtRight?: SComp; wetArea?: SComp; sink?: SComp; cooktop?: SComp };
  projectImage?: { type?: string; dataUrl?: string; width?: number; height?: number; sizeBytes?: number };
  pricing?: { total?: number | null; baseStone?: number | null; components?: Array<{ label?: string; name?: string; price?: number }> };
};

/* ── Helpers ──────────────────────────────────────────── */
const C = { dark: [44, 41, 36] as [number, number, number], mid: [80, 75, 70] as [number, number, number], light: [140, 135, 130] as [number, number, number], accent: [100, 140, 90] as [number, number, number] };
const L = 20; const R = 190; const W = R - L;
const fm = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fd = (v: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(v));
const fn = (v: number | null | undefined, s: string) => typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(2)} ${s}` : '—';

function hr(doc: jsPDF, y: number, color = [220, 215, 205] as [number, number, number]): number {
  doc.setDrawColor(...color); doc.setLineWidth(0.3); doc.line(L, y, R, y); return y + 6;
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(12).setTextColor(...C.dark).setFont('helvetica', 'bold').text(title, L, y); return y + 7;
}

function body(doc: jsPDF, y: number, left: string, right?: string): number {
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(...C.mid);
  doc.text(left, L, y);
  if (right) doc.text(right, R, y, { align: 'right' });
  return y + 5;
}

function bodyDim(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(...C.mid);
  doc.text(label, L, y);
  doc.setTextColor(...C.dark).text(value, L + 52, y);
  return y + 5;
}

function drawProjectImage(doc: jsPDF, y: number, snapshot: Snapshot): number {
  const image = snapshot.projectImage;
  const boxW = 160;
  const boxH = 60;
  const boxX = L + (W - boxW) / 2;

  doc.setFillColor(245, 243, 240);
  doc.setDrawColor(200, 195, 190);
  doc.roundedRect(boxX, y, boxW, boxH, 3, 3, 'FD');

  if (image?.dataUrl && image.type === 'image/png') {
    try {
      const sourceW = image.width && image.width > 0 ? image.width : boxW;
      const sourceH = image.height && image.height > 0 ? image.height : boxH;
      const scale = Math.min(boxW / sourceW, boxH / sourceH);
      const imageW = sourceW * scale;
      const imageH = sourceH * scale;
      const imageX = boxX + (boxW - imageW) / 2;
      const imageY = y + (boxH - imageH) / 2;
      doc.addImage(image.dataUrl, 'PNG', imageX, imageY, imageW, imageH);
      return y + boxH + 6;
    } catch {
      // Mantem o fallback textual se o PNG salvo no snapshot estiver invalido.
    }
  }

  doc.setFontSize(10).setTextColor(...C.light).setFont('helvetica', 'normal');
  doc.text('Imagem do projeto será exibida aqui', L + W / 2, y + boxH / 2 + 3, { align: 'center' });
  return y + boxH + 6;
}

/* ── Seções ──────────────────────────────────────────── */

function drawHeader(doc: jsPDF, y: number): number {
  // Barra superior
  doc.setFillColor(...C.accent); doc.rect(0, 0, 210, 4, 'F');
  // Logo placeholder
  doc.setDrawColor(200, 195, 190); doc.setLineWidth(0.5);
  doc.roundedRect(L, y, 24, 24, 2, 2, 'S');
  doc.setFontSize(7).setTextColor(...C.light).setFont('helvetica', 'normal');
  doc.text('LOGO', L + 12, y + 14, { align: 'center' });
  // Nome + contato
  const x = L + 30;
  doc.setFontSize(18).setTextColor(...C.dark).setFont('helvetica', 'bold').text('Marmoraria 3D', x, y + 6);
  doc.setFontSize(8).setTextColor(...C.mid).setFont('helvetica', 'normal');
  doc.text('contato@marmoraria3d.com.br  |  (11) 99999-9999', x, y + 14);
  doc.text('www.marmoraria3d.com.br', x, y + 20);
  return y + 30;
}

function drawQuoteInfo(doc: jsPDF, y: number, quote: QuoteInfo): number {
  // Validade: 15 dias
  const val = new Date(quote.createdAt); val.setDate(val.getDate() + 15);
  const valStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(val);

  doc.setFontSize(14).setTextColor(...C.dark).setFont('helvetica', 'bold');
  doc.text(`Orçamento #${quote.id.slice(0, 8).toUpperCase()}`, L, y);
  doc.setFontSize(9).setTextColor(...C.mid).setFont('helvetica', 'normal');
  doc.text(`Data: ${fd(quote.createdAt)}    Validade: ${valStr} (15 dias)`, L, y + 7);
  return y + 14;
}

function drawClient(doc: jsPDF, y: number, quote: QuoteInfo): number {
  y = sectionTitle(doc, y, 'Dados do cliente');
  y = bodyDim(doc, y, 'Nome:', quote.customerName);
  y = bodyDim(doc, y, 'Telefone:', quote.customerPhone);
  if (quote.customerEmail) y = bodyDim(doc, y, 'E-mail:', quote.customerEmail);
  if (quote.city) y = bodyDim(doc, y, 'Cidade:', quote.city);
  return y + 3;
}

function drawProject(doc: jsPDF, y: number, snapshot: Snapshot): number {
  const ct = snapshot.countertop ?? {};
  y = sectionTitle(doc, y, 'Projeto 3D');

  y = drawProjectImage(doc, y, snapshot);

  y = bodyDim(doc, y, 'Medidas:', `${fn(ct.width, 'm')} × ${fn(ct.depth, 'm')} × ${fn(ct.thickness, 'cm')}`);
  y = bodyDim(doc, y, 'Pedra:', ct.stoneName ?? 'Não informada');
  if (typeof ct.width === 'number' && typeof ct.depth === 'number') {
    y = bodyDim(doc, y, 'Área:', `${(ct.width * ct.depth).toFixed(2)} m²`);
  }
  return y + 3;
}

function drawFinancial(doc: jsPDF, y: number, snapshot: Snapshot, quoteTotal: number): number {
  const ct = snapshot.countertop ?? {};
  const pr = snapshot.pricing ?? {};
  const total = pr.total ?? ct.totalPrice ?? quoteTotal;
  const comps = pr.components ?? [];

  y = hr(doc, y);
  y = sectionTitle(doc, y, 'Resumo financeiro');

  // Preço da pedra: baseStone → componente "pedra" → countertop.totalPrice → 0
  const stoneName = ct.stoneName ?? 'Pedra';
  const stoneLabel = typeof ct.pricePerM2 === 'number' && Number.isFinite(ct.pricePerM2)
    ? `${stoneName} — ${fm(ct.pricePerM2)}/m²`
    : stoneName;
  let stonePrice = pr.baseStone ?? 0;
  if (!stonePrice) {
    const stoneComp = comps.find(c => {
      const n = (c.label ?? c.name ?? '').toLowerCase();
      return n.includes('pedra') || n.includes(stoneName.toLowerCase());
    });
    stonePrice = stoneComp?.price ?? ct.totalPrice ?? 0;
  }
  doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(...C.accent).text('PEDRA', L, y); y += 6;
  y = body(doc, y, stoneLabel, stonePrice > 0 ? fm(stonePrice) : 'Não informado');

  // Componentes (não-pedra)
  const nonStone = comps.filter(c => {
    const n = (c.label || c.name || '').toLowerCase();
    return !n.includes('pedra') && !n.includes(stoneName.toLowerCase());
  });
  if (nonStone.length > 0) {
    y += 2;
    doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(...C.accent).text('COMPONENTES', L, y); y += 6;
    for (const x of nonStone) {
      y = body(doc, y, `  ${x.label ?? x.name ?? 'Item'}`, typeof x.price === 'number' ? fm(x.price) : '');
    }
  }

  y = hr(doc, y, C.dark as [number, number, number]);
  doc.setFontSize(14).setFont('helvetica', 'bold').setTextColor(...C.dark);
  doc.text('TOTAL', L, y);
  doc.text(fm(total), R, y, { align: 'right' });
  return y + 10;
}

function drawNotes(doc: jsPDF, y: number): number {
  y = hr(doc, y);
  doc.setFontSize(9).setTextColor(...C.light).setFont('helvetica', 'normal');
  doc.text('Observações:', L, y); y += 6;
  const notes = [
    '• Orçamento sujeito à conferência técnica.',
    '• Valores sujeitos à disponibilidade da pedra.',
    '• Alterações após aprovação podem gerar revisão de valores.',
    '• Instalação e transporte conforme negociação comercial.',
  ];
  for (const n of notes) { doc.text(n, L, y); y += 5; }
  return y + 5;
}

function drawFooter(doc: jsPDF, y: number): void {
  const fy = Math.max(y + 6, doc.internal.pageSize.height - 20);
  doc.setDrawColor(...C.accent); doc.setLineWidth(1); doc.line(L, fy, R, fy);
  doc.setFontSize(8).setTextColor(...C.light).setFont('helvetica', 'normal');
  doc.text('Marmoraria 3D  |  Todos os direitos reservados.  |  Gerado automaticamente pelo sistema.', L + W / 2, fy + 7, { align: 'center' });
}

/* ── Export ──────────────────────────────────────────── */

export function generateQuotePDF(quote: QuoteInfo, snapshot: Snapshot | null) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 12;

  y = drawHeader(doc, y);
  y = hr(doc, y, C.accent as [number, number, number]);
  y = drawQuoteInfo(doc, y, quote);
  y = hr(doc, y);
  y = drawClient(doc, y, quote);

  if (!snapshot) {
    y = hr(doc, y);
    y = body(doc, y, 'Valor total:', fm(quote.totalPrice));
    drawFooter(doc, y + 4);
    doc.save(`orcamento-${quote.id.slice(0, 8)}.pdf`);
    return;
  }

  y = hr(doc, y, C.accent as [number, number, number]);
  y = drawProject(doc, y, snapshot);
  y = drawFinancial(doc, y, snapshot, quote.totalPrice);
  y = drawNotes(doc, y);
  drawFooter(doc, y);
  doc.save(`orcamento-${quote.id.slice(0, 8)}.pdf`);
}
