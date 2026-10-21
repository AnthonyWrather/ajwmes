#!/usr/bin/env node

/**
 * Training Video Post-Processing Pipeline
 * Scans Playwright video recordings, generates WebVTT caption tracks,
 * and copies video assets for the AJWMES role user manuals.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const videoOutputDir = path.join(rootDir, 'public', 'videos');
const rawOutputDir = path.join(rootDir, 'videos', 'raw');
const testResultsDir = path.join(rootDir, 'test-results');

// Ensure directories exist
if (!fs.existsSync(videoOutputDir)) {
  fs.mkdirSync(videoOutputDir, { recursive: true });
}
if (!fs.existsSync(rawOutputDir)) {
  fs.mkdirSync(rawOutputDir, { recursive: true });
}

console.log('========================================================================');
console.log('🎥 AJWMES Playwright Training Video Post-Processing Pipeline');
console.log('========================================================================');
console.log(`Target Output Directory: ${videoOutputDir}`);

/**
 * Scan test-results directory recursively for webm files
 */
function findWebmFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findWebmFiles(fullPath));
    } else if (file.endsWith('.webm')) {
      results.push({ path: fullPath, mtime: stat.mtime });
    }
  }
  return results;
}

// Find recorded videos
const webmFiles = findWebmFiles(testResultsDir);
if (webmFiles.length > 0) {
  console.log(`\nDiscovered ${webmFiles.length} recorded video artifact(s):`);
  for (const item of webmFiles) {
    const folderName = path.basename(path.dirname(item.path));
    let targetSlug = 'training-vignette';
    if (folderName.includes('CAD-Configurator')) {
      targetSlug = 'guest-cad-configurator';
    } else if (folderName.includes('Help-Center-Navigation')) {
      targetSlug = 'role-manual-navigation';
    } else if (folderName.includes('diagnostic')) {
      targetSlug = 'tech-diagnostic-workstation';
    }

    const rawDest = path.join(rawOutputDir, `${targetSlug}.webm`);
    const publicDest = path.join(videoOutputDir, `${targetSlug}.webm`);
    
    fs.copyFileSync(item.path, rawDest);
    fs.copyFileSync(item.path, publicDest);
    console.log(`  📹 Copied -> ${path.relative(rootDir, publicDest)} (${(fs.statSync(publicDest).size / 1024).toFixed(1)} KB)`);
  }
} else {
  console.log('⚠️ No recorded videos found in test-results yet. Run `npm run record:manuals` to record.');
}

/**
 * Generate standard WebVTT subtitle track
 */
function generateVTT(title, cues) {
  let vtt = `WEBVTT - ${title}\n\n`;
  cues.forEach((cue, index) => {
    const start = formatTimestamp(cue.startSeconds);
    const end = formatTimestamp(cue.endSeconds);
    vtt += `${index + 1}\n`;
    vtt += `${start} --> ${end}\n`;
    vtt += `${cue.text}\n\n`;
  });
  return vtt;
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.000`;
}

// Sample VTT cue sets for core role chapters
const chapterCues = {
  'guest-cad-configurator': [
    { startSeconds: 0, endSeconds: 29, text: 'Step 1: Open the Switch Panel Designer tab from the top navigation.' },
    { startSeconds: 30, endSeconds: 74, text: 'Step 2: Configure marine acrylic dimensions and corner radius.' },
    { startSeconds: 75, endSeconds: 149, text: 'Step 3: Add Contura rocker switches and digital battery voltmeters.' },
    { startSeconds: 150, endSeconds: 240, text: 'Step 4: Review live pricing and export instant laser quotation.' }
  ],
  'tech-diagnostic-workstation': [
    { startSeconds: 0, endSeconds: 44, text: 'Step 1: Select assigned vessel job from the pontoon work queue.' },
    { startSeconds: 45, endSeconds: 109, text: 'Step 2: Start diagnostic stopwatch to track labor billed at £25/hour.' },
    { startSeconds: 110, endSeconds: 189, text: 'Step 3: Requisition marine-grade tinned cables, ANL fuses, and busbars.' },
    { startSeconds: 190, endSeconds: 300, text: 'Step 4: Capture customer digital signature on the HTML5 touch canvas.' }
  ],
  'postal-fulfillment-dispatch': [
    { startSeconds: 0, endSeconds: 44, text: 'Step 1: Scan or select inbound consignment at workshop bench.' },
    { startSeconds: 45, endSeconds: 109, text: 'Step 2: Enter parcel weight and dimensions to fetch ShipStation rates.' },
    { startSeconds: 110, endSeconds: 169, text: 'Step 3: Generate 4x6" SVG thermal shipping label and packing slip.' },
    { startSeconds: 170, endSeconds: 240, text: 'Step 4: Mark dispatched to trigger automated tracking email.' }
  ]
};

// Write WebVTT caption tracks to public/videos/
for (const [chapterId, cues] of Object.entries(chapterCues)) {
  const vttContent = generateVTT(chapterId, cues);
  const filePath = path.join(videoOutputDir, `${chapterId}.vtt`);
  fs.writeFileSync(filePath, vttContent, 'utf-8');
  console.log(`✅ Generated WebVTT caption track: ${path.basename(filePath)}`);
}

console.log('\n💡 Playwright training videos are processed and ready.');
console.log('========================================================================\n');
