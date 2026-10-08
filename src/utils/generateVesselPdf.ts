import jsPDF from 'jspdf';
import { VesselSpec } from '../types';

export function generateVesselPdf(spec: VesselSpec): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper: check page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
  };

  const drawHeader = () => {
    // Header Bar Top
    doc.setFillColor(10, 25, 47); // Navy #0A192F
    doc.rect(margin, y, contentWidth, 22, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('AJW MARINE ELECTRICAL SERVICES', margin + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(56, 189, 248); // Sky #38BDF8
    doc.text('GOSPORT & SOLENT · VESSEL TECHNICAL SPECIFICATION & ELECTRICAL HISTORY', margin + 6, y + 14);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate #94A3B8
    doc.text(`AUDITED: ${spec.lastInspectionDate || new Date().toISOString().slice(0, 10)}`, pageWidth - margin - 6, y + 8, { align: 'right' });
    doc.text('DOC REF: AJW-VESSEL-SPEC', pageWidth - margin - 6, y + 14, { align: 'right' });

    y += 26;
  };

  drawHeader();

  // 1. Vessel Identity Box
  doc.setFillColor(248, 250, 252); // Slate #F8FAFC
  doc.setDrawColor(203, 213, 225); // Border #CBD5E1
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42); // Slate #0F172A
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(spec.vesselName.toUpperCase(), margin + 5, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${spec.makeModel} (${spec.year}) · ${spec.systemVoltage} DC Primary System`, margin + 5, y + 13);
  doc.text(`Home Port: ${spec.homeMarina} (${spec.berthPontoon})`, margin + 5, y + 19);

  // Right column inside box
  doc.text(`HIN: ${spec.hinNumber || 'Not specified'}`, margin + contentWidth / 2 + 10, y + 7);
  doc.text(`Sail / Reg: ${spec.sailNumber || 'Not specified'}`, margin + contentWidth / 2 + 10, y + 13);
  doc.text(`Last Survey: ${spec.lastInspectionDate}`, margin + contentWidth / 2 + 10, y + 19);

  y += 31;

  // Helper: Section Title
  const drawSectionTitle = (title: string, subtitle?: string) => {
    checkPageBreak(12);
    doc.setFillColor(14, 165, 233); // Sky #0EA5E9
    doc.rect(margin, y, 3, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), margin + 6, y + 5);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, pageWidth - margin, y + 5, { align: 'right' });
    }

    y += 8;
  };

  // Helper: Two-column Key/Value Row
  const drawRow = (label1: string, val1: string, label2: string, val2: string) => {
    checkPageBreak(7);
    const colW = contentWidth / 2;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label1, margin + 2, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val1 || '—', margin + 42, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label2, margin + colW + 2, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val2 || '—', margin + colW + 42, y + 4.2);

    y += 6.5;
  };

  // 2. DC Battery & Charging Architecture
  drawSectionTitle('1. DC Battery Banks & Smart Charging Architecture', `${spec.houseCapacityAh}Ah Domestic Total`);
  drawRow('House Battery Chemistry:', spec.houseBatteryType, 'Starter Battery:', spec.starterBatteryType);
  drawRow('Domestic Bank Capacity:', `${spec.houseCapacityAh} Ah @ ${spec.systemVoltage}`, 'Starter CCA / Ah:', `${spec.starterCca} CCA (${spec.starterCapacityAh}Ah)`);
  drawRow('House Installation Date:', spec.houseBankInstalled, 'Alternator Output:', spec.alternatorRating);
  drawRow('DC-DC Charger (Lithium):', spec.dcDcCharger, 'Battery Monitor / Shunt:', spec.batteryMonitor);
  drawRow('Solar Array Wattage:', `${spec.solarWatts}W (${spec.solarType})`, 'Solar MPPT Controller:', spec.solarController);

  y += 3;

  // 3. AC Shore Power & Galvanic Protection
  drawSectionTitle('2. 230V AC Shore Power & Cathodic Safety', spec.hasGalvanicIsolator ? 'Galvanic Protected' : 'No Isolator');
  drawRow('Shore Connection & RCD:', spec.shorePowerRating, 'Galvanic Isolator:', spec.hasGalvanicIsolator ? 'Fitted & Verified (Zinc Saver)' : 'Not Fitted (Anode Risk)');
  drawRow('Inverter / Charger:', spec.inverterModel, 'AC Consumer Unit:', '230V 50Hz 30mA Type A RCD');

  y += 3;

  // 4. Helm Electronics, Navigation & Bilge Safety
  drawSectionTitle('3. Helm Electronics, Navigation & Critical Circuits');
  drawRow('Navigation Network:', spec.navigationNetwork, 'Chartplotter (MFD):', spec.chartplotterModel);
  drawRow('VHF Radio & AIS Transponder:', spec.vhfAisDetails, 'Bilge Pump Wiring:', spec.bilgePumpConfig);
  drawRow('Main Switchboard:', spec.switchPanelModel, 'Distribution Bus:', 'Tinned Copper Marine Busbars');

  y += 4;

  // 5. Electrical History & Upgrade Audit Trail
  drawSectionTitle('4. Chronological Electrical History & Work Audit Trail', `${spec.historyLog.length} Recorded Entries`);

  spec.historyLog.forEach((log, index) => {
    checkPageBreak(22);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    // Date & contractor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(14, 165, 233);
    doc.text(`${log.date} — ${log.title}`, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Contractor: ${log.contractor}${log.jobReference ? ` · Ref: ${log.jobReference}` : ''}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });

    // Description
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(log.description, contentWidth - 6);
    doc.text(splitDesc.slice(0, 2), margin + 3, y + 9);

    // Components
    if (log.partsReplaced && log.partsReplaced.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Components: ${log.partsReplaced.join(' · ')}`, margin + 3, y + 15.5);
    }

    y += 20;
  });

  // Footer Note
  checkPageBreak(16);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This specification dossier is maintained via the AJW Marine Electrical Services Client Portal.', margin, y);
  doc.text('For diagnostics, modifications, or survey certification: anthonywrather@gmail.com · 07700 900142 · ajwmarine.co.uk', margin, y + 4);
  doc.text('Page 1 of 1', pageWidth - margin, y, { align: 'right' });

  // Save / Trigger Download
  const sanitizedName = spec.vesselName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${sanitizedName}_Electrical_Specification_AJWMES.pdf`);
}
