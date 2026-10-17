import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createVesselPdfDoc, getVesselPdfBlobUrl, VesselPdfOptions } from './generateVesselPdf.js';
import { VesselSpec } from '../types/index.js';

const mockVesselSpec: VesselSpec = {
  id: 'vessel-test-01',
  userId: 'usr-david-mercer',
  vesselName: 'Windbird III',
  makeModel: 'Moody 33 Sailing Yacht',
  year: 1981,
  hullType: 'Monohull Fin Keel',
  lengthOverall: '10.06m (33ft)',
  lengthWaterline: '8.60m',
  beam: '3.50m',
  draft: '1.45m',
  displacement: '4,760 kg',
  hinNumber: 'GB-AJW-9812',
  sailNumber: 'GBR-8421K',
  homeMarina: 'Haslar Marina, Gosport',
  berthPontoon: 'Pontoon E, Berth 14',
  systemVoltage: '12V',
  houseBatteryType: 'LiFePO4 Lithium',
  houseCapacityAh: 300,
  houseBankInstalled: 'March 2026',
  starterBatteryType: 'Heavy Duty Marine AGM',
  starterCapacityAh: 95,
  starterCca: 850,
  alternatorRating: 'Hitachi 80A with Sterling Digital Regulator',
  dcDcCharger: 'Victron Orion-Tr Smart 12/12-30A Isolated',
  solarWatts: 350,
  solarType: '2x 175W Rigid Monocrystalline Solar Panels',
  solarController: 'Victron SmartSolar MPPT 100/30 (Bluetooth)',
  batteryMonitor: 'Victron SmartShunt 500A with Bluetooth',
  shorePowerRating: '230V 16A Shore Inlet via Marine Consumer Unit',
  hasGalvanicIsolator: true,
  inverterModel: 'Victron MultiPlus 12/1200/50 Pure Sine Wave',
  navigationNetwork: 'NMEA 2000 Micro-C Backbone',
  chartplotterModel: 'B&G Zeus 9 Multi-Function Display',
  vhfAisDetails: 'Standard Horizon GX2400GPS with AIS Receiver',
  bilgePumpConfig: 'Rule 1500 GPH Automatic Submersible with Float Switch',
  switchPanelModel: 'AJWMES Custom 8-Gang Laser-Engraved Switchboard',
  generalNotes: 'Custom LiFePO4 conversion completed March 2026. Battery rotary isolators on port companionway.',
  lastInspectionDate: '2026-10-15',
  historyLog: [
    {
      id: 'log-01',
      date: '2026-03-20',
      title: 'Lithium Battery Upgrade & SmartShunt',
      contractor: 'AJW Marine Electrical Services',
      category: 'battery_upgrade',
      description: 'Replaced dual lead acid bank with 300Ah LiFePO4 bank, fitted Class T fuse and Victron Orion DC-DC.',
      partsReplaced: ['300Ah LiFePO4 Drop-In', 'Victron SmartShunt 500A', 'Blue Sea Class T Fuse 225A'],
      jobReference: 'AJW-2026-841'
    },
    {
      id: 'log-02',
      date: '2026-05-12',
      title: 'Solar MPPT Installation & Coachroof Cable Seal',
      contractor: 'AJW Marine Electrical Services',
      category: 'solar',
      description: 'Mounted 2x 175W solar panels on stainless arch, routed 6mm² solar cable through Scanstrut seal.',
      partsReplaced: ['Victron SmartSolar MPPT 100/30', 'Scanstrut DS-HD6-BLK', 'Oceanflex 6mm² Cable'],
      jobReference: 'AJW-2026-892'
    }
  ]
};

describe('generateVesselPdf utility module', () => {
  it('creates a valid jsPDF instance for a standard vessel spec', () => {
    const doc = createVesselPdfDoc(mockVesselSpec);
    assert.ok(doc, 'jsPDF instance must be created');
    assert.strictEqual(typeof doc.getNumberOfPages, 'function');
    assert.ok(doc.getNumberOfPages() >= 1, 'Document must have at least one page');
  });

  it('restricts document to a single page in single_page_summary mode', () => {
    const doc = createVesselPdfDoc(mockVesselSpec, {
      mode: 'single_page_summary'
    });
    assert.strictEqual(doc.getNumberOfPages(), 1, 'single_page_summary mode must produce exactly 1 page');
  });

  it('generates multi-page comprehensive dossier when history log is included', () => {
    // Add multiple history logs to guarantee multi-page expansion
    const extendedVessel: VesselSpec = {
      ...mockVesselSpec,
      historyLog: [
        ...mockVesselSpec.historyLog,
        {
          id: 'log-03',
          date: '2026-07-04',
          title: 'NMEA 2000 Backbone Refit & AIS Transceiver',
          contractor: 'AJW Marine Electrical Services',
          category: 'navigation',
          description: 'Installed Maretron 5-drop micro backbone and wired AIS NMEA output to plotter.',
          partsReplaced: ['Maretron Micro Drop Cable', 'Raymarine AIS700 Transceiver'],
          jobReference: 'AJW-2026-944'
        },
        {
          id: 'log-04',
          date: '2026-08-18',
          title: 'Anchor Windlass High-Amp Circuit Overhaul',
          contractor: 'AJW Marine Electrical Services',
          category: 'maintenance',
          description: 'Replaced corroded 35mm² forepeak cables with tinned Oceanflex and fitted 90A thermal breaker.',
          partsReplaced: ['Oceanflex 35mm² Tinned Cable', 'Blue Sea 285-Series 90A Breaker'],
          jobReference: 'AJW-2026-981'
        },
        {
          id: 'log-05',
          date: '2026-09-30',
          title: 'Galvanic Isolator Fitment & Anode Potential Test',
          contractor: 'AJW Marine Electrical Services',
          category: 'inspection',
          description: 'Fitted 32A fail-safe zinc saver isolator in series with green earth wire.',
          partsReplaced: ['Sterling 32A Galvanic Isolator', 'Fail-Safe Ground Monitor'],
          jobReference: 'AJW-2026-1022'
        }
      ]
    };

    const doc = createVesselPdfDoc(extendedVessel, {
      mode: 'comprehensive',
      includeHistory: true
    });

    assert.ok(doc.getNumberOfPages() >= 2, 'Comprehensive mode with extended history must create at least 2 pages');
  });

  it('renders correctly with high_contrast_mono ink saver theme', () => {
    const doc = createVesselPdfDoc(mockVesselSpec, {
      colorTheme: 'high_contrast_mono'
    });
    assert.ok(doc);
    assert.ok(doc.getNumberOfPages() >= 1);
  });

  it('handles custom skipper notes correctly', () => {
    const customNotes = 'Skipper Note: Spare fuses and isolator bypass key stowed in chart table drawer B.';
    const doc = createVesselPdfDoc(mockVesselSpec, {
      customNotes,
      mode: 'single_page_summary'
    });
    assert.ok(doc);
    assert.strictEqual(doc.getNumberOfPages(), 1);
  });

  it('respects emergency notes and critical fuse exclusion flags', () => {
    const docWithoutSafety = createVesselPdfDoc(mockVesselSpec, {
      mode: 'single_page_summary',
      includeEmergencyNotes: false,
      includeCriticalFuses: false
    });
    assert.ok(docWithoutSafety);
    assert.strictEqual(docWithoutSafety.getNumberOfPages(), 1);
  });

  it('handles minimal vessel specification with missing optional fields gracefully', () => {
    const minimalVessel: VesselSpec = {
      id: 'vessel-minimal',
      userId: 'usr-guest-01',
      vesselName: 'Small Tender',
      makeModel: 'Avon Inflatable',
      year: 2020,
      hullType: 'Tender / Dinghy',
      homeMarina: 'Portsmouth Harbour',
      berthPontoon: 'Berth 1',
      systemVoltage: '12V',
      houseBatteryType: 'AGM Deep Cycle',
      houseCapacityAh: 60,
      houseBankInstalled: '2023',
      starterBatteryType: 'AGM',
      starterCapacityAh: 40,
      starterCca: 350,
      alternatorRating: 'Outboard Stator 15A',
      dcDcCharger: 'N/A',
      solarWatts: 0,
      solarType: 'None',
      solarController: 'None',
      batteryMonitor: 'LED Voltmeter',
      shorePowerRating: 'No AC Shore Connection',
      hasGalvanicIsolator: false,
      inverterModel: 'None',
      navigationNetwork: 'Standalone',
      chartplotterModel: 'Garmin Striker 4',
      vhfAisDetails: 'Handheld VHF',
      bilgePumpConfig: 'Manual Hand Pump',
      switchPanelModel: '4-Gang Toggle Panel',
      hinNumber: '',
      sailNumber: '',
      generalNotes: '',
      lastInspectionDate: '',
      historyLog: []
    };

    const doc = createVesselPdfDoc(minimalVessel, {
      mode: 'single_page_summary',
      includeHistory: false
    });
    assert.ok(doc);
    assert.strictEqual(doc.getNumberOfPages(), 1);
  });

  it('creates valid blob URL when URL.createObjectURL is supported or mocked', () => {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const blobUrl = getVesselPdfBlobUrl(mockVesselSpec);
      assert.ok(blobUrl.startsWith('blob:'), 'Returned URL must be a blob URI');
    } else {
      // In Node.js environment where URL.createObjectURL might not be present by default
      const origCreate = (URL as any).createObjectURL;
      (URL as any).createObjectURL = (blob: any) => `blob:mock-uuid-${blob.size || 100}`;
      try {
        const blobUrl = getVesselPdfBlobUrl(mockVesselSpec);
        assert.ok(blobUrl.startsWith('blob:'), 'Returned URL must be a blob URI');
      } finally {
        (URL as any).createObjectURL = origCreate;
      }
    }
  });
});
