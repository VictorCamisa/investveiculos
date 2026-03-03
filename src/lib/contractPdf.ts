import { Contract } from '@/hooks/useContracts';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BRAND_GOLD = { r: 184, g: 134, b: 11 };
const BRAND_BLACK = { r: 26, g: 26, b: 26 };
const BRAND_GRAY = { r: 100, g: 100, b: 100 };
const BRAND_LIGHT_GRAY = { r: 200, g: 200, b: 200 };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function addHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  doc.setDrawColor(BRAND_GOLD.r, BRAND_GOLD.g, BRAND_GOLD.b);
  doc.setLineWidth(3);
  doc.line(0, 0, pageWidth, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 8, pageWidth - margin, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(BRAND_GOLD.r, BRAND_GOLD.g, BRAND_GOLD.b);
  doc.text('INVEST', margin, 22);
  doc.setFontSize(12);
  doc.setTextColor(BRAND_GRAY.r, BRAND_GRAY.g, BRAND_GRAY.b);
  doc.text('VEÍCULOS', margin + 38, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('(11) 99999-9999', pageWidth - margin, 14, { align: 'right' });
  doc.text('investveiculos.com.br', pageWidth - margin, 19, { align: 'right' });

  doc.setDrawColor(BRAND_GOLD.r, BRAND_GOLD.g, BRAND_GOLD.b);
  doc.setLineWidth(1.5);
  doc.line(margin, 30, pageWidth - margin, 30);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);
  doc.text(title, pageWidth / 2, 42, { align: 'center' });
  return 50;
}

function addWatermark(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(240, 240, 240);
  doc.text('INVEST VEÍCULOS', pw / 2, ph / 2, { align: 'center', angle: 45 });
}

function addFooter(doc: jsPDF, pageNum: number = 1) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 15;
  doc.setDrawColor(BRAND_GOLD.r, BRAND_GOLD.g, BRAND_GOLD.b);
  doc.setLineWidth(1);
  doc.line(margin, ph - 20, pw - margin, ph - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(BRAND_GRAY.r, BRAND_GRAY.g, BRAND_GRAY.b);
  doc.text('Invest Veículos - Seminovos Premium', pw / 2, ph - 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Página ${pageNum}`, pw - margin, ph - 9, { align: 'right' });
}

function addSectionHeader(doc: jsPDF, text: string, y: number, margin: number) {
  doc.setDrawColor(BRAND_GOLD.r, BRAND_GOLD.g, BRAND_GOLD.b);
  doc.setLineWidth(2);
  doc.line(margin, y - 2, margin + 3, y - 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_GOLD.r, BRAND_GOLD.g, BRAND_GOLD.b);
  doc.text(text, margin + 6, y);
  doc.setTextColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);
  return y + 6;
}

function generateSaleContractPDF(contract: Contract) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  addWatermark(doc);
  let y = addHeader(doc, 'CONTRATO DE VENDA DE VEÍCULO');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);

  y = addSectionHeader(doc, 'VENDEDOR', y, margin);
  doc.setFont('helvetica', 'normal');
  const sellerText = 'INVEST VEÍCULOS, com sede em São Paulo-SP.';
  doc.text(sellerText, margin, y);
  y += 8;

  y = addSectionHeader(doc, 'COMPRADOR', y, margin);
  doc.setFont('helvetica', 'normal');
  const buyerText = `${contract.customer_name.toUpperCase()}, ${(contract.customer_nationality || 'BRASILEIRO(A)').toUpperCase()}, ${(contract.customer_profession || '').toUpperCase()}, RG n° ${contract.customer_rg || '___________'}, CPF n° ${contract.customer_cpf || '___________'}, residente na ${contract.customer_address?.toUpperCase() || '___________'}, ${contract.customer_city?.toUpperCase() || '___________'}-${contract.customer_state?.toUpperCase() || '___'}, telefone ${contract.customer_phone || '___________'}`;
  const buyerLines = doc.splitTextToSize(buyerText, contentWidth);
  doc.text(buyerLines, margin, y);
  y += buyerLines.length * 4 + 6;

  y = addSectionHeader(doc, 'OBJETO', y, margin);
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(BRAND_LIGHT_GRAY.r, BRAND_LIGHT_GRAY.g, BRAND_LIGHT_GRAY.b);
  doc.roundedRect(margin, y - 3, contentWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const vehicleText = `${contract.vehicle_brand.toUpperCase()} ${contract.vehicle_model.toUpperCase()}, ${contract.vehicle_year}, Placa: ${contract.vehicle_plate?.toUpperCase() || '___'}, Cor: ${contract.vehicle_color?.toUpperCase() || '___'}`;
  doc.text(vehicleText, margin + 4, y + 5);
  y += 18;

  doc.setFontSize(9);
  y = addSectionHeader(doc, 'FORMA DE PAGAMENTO', y, margin);
  doc.setFont('helvetica', 'normal');
  doc.text(`Valor total: ${formatCurrency(contract.vehicle_value)}`, margin, y);
  y += 5;
  if (contract.down_payment && contract.down_payment > 0) {
    doc.text(`• Entrada: ${formatCurrency(contract.down_payment)}`, margin + 3, y);
    y += 5;
  }
  if (contract.trade_in_brand) {
    doc.text(`• Veículo de troca: ${contract.trade_in_brand} ${contract.trade_in_model || ''} - ${formatCurrency(contract.trade_in_value || 0)}`, margin + 3, y);
    y += 5;
  }
  if (contract.installments_count && contract.installments_count > 0) {
    doc.text(`• Parcelamento: ${contract.installments_count}x de ${formatCurrency(contract.installment_value || 0)}`, margin + 3, y);
    y += 5;
  }
  y += 8;

  y = addSectionHeader(doc, 'GARANTIA', y, margin);
  doc.setFontSize(8);
  const warranties = [
    'O COMPRADOR adquire o veículo no estado em que se encontra, atestando ter vistoriado.',
    'Garantia de 90 dias conforme Art. 26, II, do CDC para vícios ocultos.',
    'Componentes elétricos, eletrônicos e de acabamento não estão cobertos pela garantia.',
  ];
  warranties.forEach(w => {
    const lines = doc.splitTextToSize(`• ${w}`, contentWidth - 5);
    doc.text(lines, margin + 3, y);
    y += lines.length * 3.5 + 2;
  });

  if (y > 250) { addFooter(doc, 1); doc.addPage(); addWatermark(doc); y = 20; }

  y += 5;
  doc.setFontSize(9);
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFont('helvetica', 'italic');
  doc.text(`São Paulo, ${today}`, margin, y);
  y += 20;

  doc.setDrawColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 75, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INVEST VEÍCULOS', margin, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_GRAY.r, BRAND_GRAY.g, BRAND_GRAY.b);
  doc.text('VENDEDOR', margin, y + 10);

  doc.line(pageWidth - margin - 75, y, pageWidth - margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);
  doc.text(contract.customer_name.toUpperCase().substring(0, 35), pageWidth - margin - 75, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_GRAY.r, BRAND_GRAY.g, BRAND_GRAY.b);
  doc.text('COMPRADOR', pageWidth - margin - 75, y + 10);

  addFooter(doc, 1);
  return doc;
}

function generatePurchaseContractPDF(contract: Contract) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  addWatermark(doc);
  let y = addHeader(doc, 'CONTRATO DE COMPRA DE VEÍCULO');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);

  y = addSectionHeader(doc, 'COMPRADOR (LOJA)', y, margin);
  doc.text('INVEST VEÍCULOS, com sede em São Paulo-SP.', margin, y);
  y += 8;

  y = addSectionHeader(doc, 'VENDEDOR', y, margin);
  const sellerText = `${contract.customer_name.toUpperCase()}, CPF n° ${contract.customer_cpf || '___________'}, telefone ${contract.customer_phone || '___________'}`;
  const sellerLines = doc.splitTextToSize(sellerText, contentWidth);
  doc.text(sellerLines, margin, y);
  y += sellerLines.length * 4 + 6;

  y = addSectionHeader(doc, 'OBJETO', y, margin);
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(BRAND_LIGHT_GRAY.r, BRAND_LIGHT_GRAY.g, BRAND_LIGHT_GRAY.b);
  doc.roundedRect(margin, y - 3, contentWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${contract.vehicle_brand.toUpperCase()} ${contract.vehicle_model.toUpperCase()}, ${contract.vehicle_year}`, margin + 4, y + 5);
  y += 18;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y = addSectionHeader(doc, 'NEGOCIAÇÃO', y, margin);
  doc.text(`Comprado pelo valor de ${formatCurrency(contract.vehicle_value)}`, margin, y);
  y += 10;

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFont('helvetica', 'italic');
  doc.text(`São Paulo, ${today}`, margin, y);
  y += 20;

  doc.setDrawColor(BRAND_BLACK.r, BRAND_BLACK.g, BRAND_BLACK.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 75, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INVEST VEÍCULOS', margin, y + 5);
  doc.line(pageWidth - margin - 75, y, pageWidth - margin, y);
  doc.text(contract.customer_name.toUpperCase().substring(0, 35), pageWidth - margin - 75, y + 5);

  addFooter(doc, 1);
  return doc;
}

export function downloadContractPDF(contract: Contract) {
  const doc = contract.contract_type === 'compra'
    ? generatePurchaseContractPDF(contract)
    : generateSaleContractPDF(contract);
  doc.save(`${contract.contract_number}.pdf`);
}
