import jsPDF from 'jspdf';
import { VesselSpec } from '../types';

export interface VesselPdfOptions {
  mode?: 'single_page_summary' | 'comprehensive';
  colorTheme?: 'marine_navy' | 'high_contrast_mono';
  includeEmergencyNotes?: boolean;
  includeHistory?: boolean;
  includeCriticalFuses?: boolean;
  paperFormat?: 'a4' | 'letter';
  customNotes?: string;
}

export function createVesselPdfDoc(spec: VesselSpec, options: VesselPdfOptions = {}): jsPDF {
  const {
    mode = 'comprehensive',
    colorTheme = 'marine_navy',
    includeEmergencyNotes = true,
    includeHistory = mode === 'comprehensive',
    includeCriticalFuses = true,
    paperFormat = 'a4',
    customNotes = ''
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperFormat
  });

  const isMono = colorTheme === 'high_contrast_mono';
  const isOnePage = mode === 'single_page_summary';

  // Palette definitions
  const colors = {
    headerBg: isMono ? [30, 41, 59] : [10, 25, 47], // Dark Slate or Deep Navy #0A192F
    accent: isMono ? [71, 85, 105] : [14, 165, 233], // Neutral Slate or Sky #0EA5E9
    accentLight: isMono ? [241, 245, 249] : [240, 249, 255],
    subtext: isMono ? [100, 116, 139] : [56, 189, 248], // Sky #38BDF8
    textDark: [15, 23, 42],
    textMuted: [100, 116, 139],
    cardBg: isMono ? [255, 255, 255] : [248, 250, 252],
    cardBorder: isMono ? [148, 163, 184] : [203, 213, 225],
    tableBgAlt: isMono ? [248, 250, 252] : [241, 245, 249],
    alertBg: isMono ? [241, 245, 249] : [254, 242, 242],
    alertBorder: isMono ? [100, 116, 139] : [239, 68, 68],
    alertText: isMono ? [15, 23, 42] : [185, 28, 28],
    badgeBg: isMono ? [226, 232, 240] : [224, 242, 254],
    badgeText: isMono ? [15, 23, 42] : [3, 105, 161]
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (isOnePage) {
      // In one-page summary mode, do not spawn a new page
      return;
    }
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawHeader(false);
    }
  };

  const drawHeader = (isFirstPage: boolean = true) => {
    const headerHeight = isFirstPage ? (isOnePage ? 20 : 22) : 14;
    doc.setFillColor(colors.headerBg[0], colors.headerBg[1], colors.headerBg[2]);
    doc.rect(margin, y, contentWidth, headerHeight, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFirstPage ? 13 : 10);
    doc.text(
      'AJW MARINE ELECTRICAL SERVICES',
      margin + 5,
      y + (isFirstPage ? 7.5 : 6)
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isFirstPage ? 7.5 : 6.5);
    doc.setTextColor(colors.subtext[0], colors.subtext[1], colors.subtext[2]);
    doc.text(
      isFirstPage
        ? (isOnePage ? 'VESSEL ON-BOARD ELECTRICAL SUMMARY · CHART TABLE & HELM SPEC' : 'GOSPORT & SOLENT · TECHNICAL SPECIFICATION & ELECTRICAL HISTORY')
        : `${spec.vesselName.toUpperCase()} · ELECTRICAL AUDIT CONTINUATION`,
      margin + 5,
      y + (isFirstPage ? 13.5 : 10.5)
    );

    // Right-aligned reference & date
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    const currentDate = spec.lastInspectionDate || new Date().toISOString().slice(0, 10);
    doc.text(`AUDITED: ${currentDate}`, pageWidth - margin - 5, y + (isFirstPage ? 7.5 : 6), { align: 'right' });
    doc.text(`DOC: AJW-VESSEL-${spec.systemVoltage.replace(/[^a-zA-Z0-9]/g, '')}`, pageWidth - margin - 5, y + (isFirstPage ? 13.5 : 10.5), { align: 'right' });

    y += headerHeight + 3;
  };

  // Helper: Section Title
  const drawSectionTitle = (title: string, subtitle?: string) => {
    checkPageBreak(9);
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.rect(margin, y, 3, isOnePage ? 4.5 : 5.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isOnePage ? 8.5 : 9.5);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text(title.toUpperCase(), margin + 5, y + (isOnePage ? 3.8 : 4.5));

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(subtitle, pageWidth - margin, y + (isOnePage ? 3.8 : 4.5), { align: 'right' });
    }

    y += isOnePage ? 6 : 7.5;
  };

  // Helper: Row
  const drawRow = (label1: string, val1: string, label2: string, val2: string) => {
    const rowHeight = isOnePage ? 5 : 5.8;
    checkPageBreak(rowHeight + 1);
    const colW = contentWidth / 2;

    doc.setFillColor(colors.tableBgAlt[0], colors.tableBgAlt[1], colors.tableBgAlt[2]);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');

    // Subtle line divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(margin + colW, y, margin + colW, y + rowHeight);

    doc.setFontSize(isOnePage ? 7 : 7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label1, margin + 2.5, y + (rowHeight - 1.8));

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const splitVal1 = doc.splitTextToSize(val1 || '—', colW - 40);
    doc.text(splitVal1[0] || '—', margin + 38, y + (rowHeight - 1.8));

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label2, margin + colW + 2.5, y + (rowHeight - 1.8));

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const splitVal2 = doc.splitTextToSize(val2 || '—', colW - 40);
    doc.text(splitVal2[0] || '—', margin + colW + 38, y + (rowHeight - 1.8));

    y += rowHeight + 0.8;
  };

  // START DOCUMENT RENDERING
  drawHeader(true);

  // 1. Vessel Identity Box
  const identityHeight = isOnePage ? 20 : 24;
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, identityHeight, 2, 2, 'FD');

  // Vessel Name & System Voltage Badge
  doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isOnePage ? 11 : 12.5);
  doc.text(spec.vesselName.toUpperCase(), margin + 4, y + (isOnePage ? 5.5 : 6.5));

  // Voltage badge
  const badgeW = 28;
  const badgeH = 5;
  const badgeX = margin + 4 + doc.getTextWidth(spec.vesselName.toUpperCase()) + 4;
  doc.setFillColor(colors.badgeBg[0], colors.badgeBg[1], colors.badgeBg[2]);
  doc.roundedRect(badgeX, y + (isOnePage ? 1.5 : 2.5), badgeW, badgeH, 1, 1, 'F');
  doc.setFontSize(7);
  doc.setTextColor(colors.badgeText[0], colors.badgeText[1], colors.badgeText[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${spec.systemVoltage} DC SYSTEM`, badgeX + 2, y + (isOnePage ? 4.8 : 5.8));

  // Left Details
  doc.setFontSize(isOnePage ? 7.5 : 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${spec.makeModel} (${spec.year})`, margin + 4, y + (isOnePage ? 11 : 13));
  doc.text(`Mooring: ${spec.homeMarina} (${spec.berthPontoon})`, margin + 4, y + (isOnePage ? 16 : 19));

  // Right Details
  const midX = margin + contentWidth / 2 + 10;
  doc.text(`HIN: ${spec.hinNumber || 'Not specified'}`, midX, y + (isOnePage ? 6 : 7));
  doc.text(`Sail / Reg: ${spec.sailNumber || 'Not specified'}`, midX, y + (isOnePage ? 11 : 13));
  doc.text(`Last Survey: ${spec.lastInspectionDate}`, midX, y + (isOnePage ? 16 : 19));

  y += identityHeight + (isOnePage ? 2.5 : 3.5);

  // 2. Emergency Isolation & Safety Notice Box (if requested)
  if (includeEmergencyNotes) {
    const emergH = isOnePage ? 13 : 15;
    checkPageBreak(emergH + 2);
    doc.setFillColor(colors.alertBg[0], colors.alertBg[1], colors.alertBg[2]);
    doc.setDrawColor(colors.alertBorder[0], colors.alertBorder[1], colors.alertBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, emergH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.alertText[0], colors.alertText[1], colors.alertText[2]);
    doc.text('ON-BOARD ELECTRICAL SAFETY & EMERGENCY ISOLATION PROTOCOL', margin + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text('• MASTER ISOLATOR: Turn battery rotary isolator switch OFF during dock fire or severe electrical short circuit.', margin + 3, y + 8);
    doc.text('• BILGE PUMPS: Hardwired directly to battery bus via constant fuse. Remains active when master isolator is off.', margin + 3, y + 11.5);

    y += emergH + (isOnePage ? 2.5 : 3.5);
  }

  // 3. DC Battery & Smart Charging Architecture
  drawSectionTitle('1. DC Battery Banks & Smart Charging Architecture', `${spec.houseCapacityAh}Ah Domestic Total`);
  drawRow('House Battery Chemistry:', spec.houseBatteryType, 'Starter Battery:', spec.starterBatteryType);
  drawRow('Domestic Bank Capacity:', `${spec.houseCapacityAh} Ah @ ${spec.systemVoltage}`, 'Starter CCA / Ah:', `${spec.starterCca} CCA (${spec.starterCapacityAh}Ah)`);
  drawRow('House Installation Date:', spec.houseBankInstalled, 'Alternator Output:', spec.alternatorRating);
  drawRow('DC-DC Charger (Lithium):', spec.dcDcCharger, 'Battery Monitor / Shunt:', spec.batteryMonitor);
  drawRow('Solar Array Wattage:', `${spec.solarWatts}W (${spec.solarType})`, 'Solar MPPT Controller:', spec.solarController);

  y += isOnePage ? 2 : 3;

  // 4. AC Shore Power & Galvanic Protection
  drawSectionTitle('2. 230V AC Shore Power & Cathodic Safety', spec.hasGalvanicIsolator ? 'Galvanic Protected' : 'Warning: No Isolator');
  drawRow('Shore Connection & RCD:', spec.shorePowerRating, 'Galvanic Isolator:', spec.hasGalvanicIsolator ? 'Fitted & Verified (Zinc Saver)' : 'Not Fitted (Anode Risk)');
  drawRow('Inverter / Charger:', spec.inverterModel, 'AC Consumer Unit:', '230V 50Hz 30mA Type A RCD');

  y += isOnePage ? 2 : 3;

  // 5. Helm Electronics & Bilge Safety
  drawSectionTitle('3. Helm Electronics, Navigation & Critical Circuits');
  drawRow('Navigation Network:', spec.navigationNetwork, 'Chartplotter (MFD):', spec.chartplotterModel);
  drawRow('VHF Radio & AIS Transponder:', spec.vhfAisDetails, 'Bilge Pump Circuit:', spec.bilgePumpConfig);
  drawRow('Main Switchboard:', spec.switchPanelModel, 'Distribution Bus:', 'Tinned Copper Marine Busbars');

  y += isOnePage ? 2 : 3.5;

  // 6. Critical Circuit & Fuse Ratings Table (if included)
  if (includeCriticalFuses) {
    drawSectionTitle('4. Critical On-Board Fuse & Breaker Ratings Guide');
    drawRow('House Main Battery Fuse:', 'Class T / ANL 250A-300A', 'Anchor Windlass Circuit:', 'High-Amp Marine Breaker 80A-100A');
    drawRow('Bilge Pump Direct Float:', 'Inline Blade Fuse 5A-10A', 'Solar Array MPPT In/Out:', 'MIDI / Auto Breaker 30A-40A');
    y += isOnePage ? 2 : 3;
  }

  // 7. General Vessel Notes / Custom print notes
  if (customNotes || spec.generalNotes) {
    const notesToPrint = customNotes || spec.generalNotes;
    checkPageBreak(12);
    doc.setFillColor(colors.tableBgAlt[0], colors.tableBgAlt[1], colors.tableBgAlt[2]);
    doc.rect(margin, y, contentWidth, isOnePage ? 9 : 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('ENGINEER & ON-BOARD TECHNICAL NOTES:', margin + 2.5, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    const splitNotes = doc.splitTextToSize(notesToPrint, contentWidth - 6);
    doc.text(splitNotes.slice(0, isOnePage ? 2 : 3), margin + 2.5, y + 7);
    y += (isOnePage ? 10 : 13);
  }

  // 8. Electrical History Log (if comprehensive mode and requested)
  if (includeHistory && spec.historyLog && spec.historyLog.length > 0 && !isOnePage) {
    drawSectionTitle('5. Chronological Electrical History & Work Audit Trail', `${spec.historyLog.length} Recorded Entries`);

    spec.historyLog.forEach((log) => {
      checkPageBreak(21);

      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

      // Date & title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.text(`${log.date} — ${log.title}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(`Contractor: ${log.contractor}${log.jobReference ? ` · Ref: ${log.jobReference}` : ''}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });

      // Description
      doc.setTextColor(51, 65, 85);
      const splitDesc = doc.splitTextToSize(log.description, contentWidth - 6);
      doc.text(splitDesc.slice(0, 2), margin + 3, y + 9);

      // Components
      if (log.partsReplaced && log.partsReplaced.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.8);
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(`Components: ${log.partsReplaced.join(' · ')}`, margin + 3, y + 15.5);
      }

      y += 20;
    });
  }

  // 9. Sign-off Stamp & Footer on Every Page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    const footY = pageHeight - 11;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, footY, pageWidth - margin, footY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Maintained via AJW Marine Electrical Services Client Portal · Gosport, Solent UK',
      margin,
      footY + 4
    );
    doc.text(
      'Emergency Engineer Contact: anthonywrather@gmail.com · 07700 900142 · ajwmarine.co.uk',
      margin,
      footY + 7.5
    );
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - margin,
      footY + 4,
      { align: 'right' }
    );
    doc.text(
      'Certified Solent Marine Spec',
      pageWidth - margin,
      footY + 7.5,
      { align: 'right' }
    );
  }

  return doc;
}

export function generateVesselPdf(spec: VesselSpec, options: VesselPdfOptions = {}): void {
  const doc = createVesselPdfDoc(spec, options);
  const sanitizedName = (spec.vesselName || 'Vessel').replace(/[^a-zA-Z0-9]/g, '_');
  const modeSuffix = options.mode === 'single_page_summary' ? 'Summary_Sheet' : 'Technical_Dossier';
  doc.save(`${sanitizedName}_Electrical_${modeSuffix}_AJWMES.pdf`);
}

export function getVesselPdfBlobUrl(spec: VesselSpec, options: VesselPdfOptions = {}): string {
  const doc = createVesselPdfDoc(spec, options);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

export function printVesselPdf(spec: VesselSpec, options: VesselPdfOptions = {}): void {
  const doc = createVesselPdfDoc(spec, options);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Hidden iframe printing technique for clean, seamless local printing on board
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }, 200);
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.open', e);
      window.open(blobUrl, '_blank');
    }
  };
}
