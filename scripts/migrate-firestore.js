import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.resolve(__dirname, '../firestore-backup-prime-sign.json');
if (!fs.existsSync(backupPath)) {
  console.error('Backup file not found at:', backupPath);
  process.exit(1);
}

const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Target project configuration
const targetProjectId = process.argv[2] || process.env.TARGET_PROJECT_ID || 'gen-lang-client-0618772940';
const databaseId = process.env.TARGET_DATABASE_ID || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a';
const apiKey = process.env.TARGET_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg';

console.log(`\n========================================`);
console.log(`AJW Marine - Firestore Datastore Migrator`);
console.log(`========================================`);
console.log(`Source data: ${backupPath}`);
console.log(`Target Project: ${targetProjectId}`);
console.log(`Target Database: ${databaseId}`);
console.log(`========================================\n`);

const app = initializeApp({
  projectId: targetProjectId,
  apiKey: apiKey,
  authDomain: `${targetProjectId}.firebaseapp.com`
});

// Try named database first, then default
async function runMigration() {
  let db;
  try {
    db = getFirestore(app, databaseId);
    console.log(`Checking connection to named database '${databaseId}' on ${targetProjectId}...`);
    await getDoc(doc(db, 'test', 'connection'));
    console.log(`Connection successful to named database '${databaseId}'.`);
  } catch (err) {
    console.warn(`Named database '${databaseId}' check failed:`, err.message);
    console.log(`Falling back to default database '(default)' on ${targetProjectId}...`);
    try {
      db = getFirestore(app);
      await getDoc(doc(db, 'test', 'connection'));
      console.log(`Connection successful to default database.`);
    } catch (err2) {
      console.error(`\n[ERROR] Could not connect to target database in project '${targetProjectId}':`, err2.message);
      console.error(`Please ensure a Firestore database has been created in project '${targetProjectId}' via the Firebase Console.`);
      console.error(`Console URL: https://console.firebase.google.com/project/${targetProjectId}/firestore\n`);
      process.exit(1);
    }
  }

  let totalMigrated = 0;
  for (const [colName, docs] of Object.entries(backupData)) {
    console.log(`Migrating collection: '${colName}' (${docs.length} documents)...`);
    for (const docData of docs) {
      const docId = docData.id;
      const cleanData = { ...docData };
      delete cleanData.id;
      try {
        await setDoc(doc(db, colName, docId), cleanData, { merge: true });
        totalMigrated++;
      } catch (docErr) {
        console.error(`Failed to migrate ${colName}/${docId}:`, docErr.message);
      }
    }
  }

  console.log(`\nMigration completed successfully! Total documents migrated: ${totalMigrated}`);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
