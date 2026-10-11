import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { KNOWN_FIREBASE_PROJECTS } from './firebaseConfig';
import backupJson from '../../firestore-backup-prime-sign.json';

export interface MigrationProgress {
  status: 'idle' | 'checking' | 'migrating' | 'completed' | 'error';
  message: string;
  totalDocs: number;
  migratedDocs: number;
  errorDetail?: string;
}

export async function migrateDataToProject(
  targetProjectId: 'gen-lang-client-0618772940' | 'prime-sign-454323-a1',
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ success: boolean; error?: string }> {
  const targetConfig = KNOWN_FIREBASE_PROJECTS[targetProjectId];
  if (!targetConfig) {
    const err = `Unknown target project: ${targetProjectId}`;
    onProgress?.({ status: 'error', message: err, totalDocs: 0, migratedDocs: 0, errorDetail: err });
    return { success: false, error: err };
  }

  onProgress?.({
    status: 'checking',
    message: `Connecting to ${targetProjectId}...`,
    totalDocs: 0,
    migratedDocs: 0
  });

  try {
    const targetApp = initializeApp(targetConfig, `migration-${Date.now()}`);
    let targetDb;

    try {
      targetDb = getFirestore(targetApp, targetConfig.firestoreDatabaseId);
      await getDoc(doc(targetDb, 'test', 'connection'));
    } catch (dbErr) {
      // Try default database fallback
      try {
        targetDb = getFirestore(targetApp);
        await getDoc(doc(targetDb, 'test', 'connection'));
      } catch (defaultErr) {
        const errorMsg = defaultErr instanceof Error ? defaultErr.message : String(defaultErr);
        const detailed = errorMsg.includes('offline') || errorMsg.includes('not-found')
          ? `Firestore is not yet created in project '${targetProjectId}'. Please click 'Open Firebase Console' below to create a Firestore database first.`
          : errorMsg;
        onProgress?.({
          status: 'error',
          message: `Database connection failed on ${targetProjectId}`,
          totalDocs: 0,
          migratedDocs: 0,
          errorDetail: detailed
        });
        return { success: false, error: detailed };
      }
    }

    const data = backupJson as Record<string, any[]>;
    let totalCount = 0;
    Object.values(data).forEach(list => {
      totalCount += list.length;
    });

    onProgress?.({
      status: 'migrating',
      message: `Writing ${totalCount} documents to ${targetProjectId}...`,
      totalDocs: totalCount,
      migratedDocs: 0
    });

    let migrated = 0;
    for (const [colName, docs] of Object.entries(data)) {
      for (const item of docs) {
        const docId = item.id;
        const payload = { ...item };
        delete payload.id;
        await setDoc(doc(targetDb, colName, docId), payload, { merge: true });
        migrated++;
        onProgress?.({
          status: 'migrating',
          message: `Migrated ${migrated} of ${totalCount} records (${colName}/${docId})...`,
          totalDocs: totalCount,
          migratedDocs: migrated
        });
      }
    }

    onProgress?.({
      status: 'completed',
      message: `Successfully migrated all ${migrated} documents to ${targetProjectId}!`,
      totalDocs: totalCount,
      migratedDocs: migrated
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onProgress?.({
      status: 'error',
      message: `Migration error: ${msg}`,
      totalDocs: 0,
      migratedDocs: 0,
      errorDetail: msg
    });
    return { success: false, error: msg };
  }
}
