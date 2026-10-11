import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Server, 
  Layers, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Eye,
  GitBranch,
  Terminal,
  Cpu,
  Copy,
  Check
} from 'lucide-react';
import { 
  detectEnvironment, 
  setEnvironmentOverride, 
  AppEnvironment, 
  EnvironmentInfo 
} from '../../lib/environment';
import { 
  exportEnvironmentData, 
  importEnvironmentData, 
  resetEnvironmentToTestData, 
  ExportedEnvironmentData 
} from '../../lib/envStorage';
import { FirestoreConnectionState } from '../../types';
import { 
  KNOWN_FIREBASE_PROJECTS, 
  getStoredProjectOverride, 
  setStoredProjectOverride 
} from '../../lib/firebaseConfig';
import { migrateDataToProject, MigrationProgress } from '../../lib/migration';

interface EnvironmentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: FirestoreConnectionState;
  onDataResetOrImported?: () => void;
  onRetryConnection?: () => Promise<boolean | void>;
}

export const EnvironmentSettingsModal: React.FC<EnvironmentSettingsModalProps> = ({
  isOpen,
  onClose,
  connectionState,
  onDataResetOrImported,
  onRetryConnection
}) => {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo>(() => detectEnvironment());
  const [activeTab, setActiveTab] = useState<'overview' | 'migration' | 'testdata' | 'guide'>('overview');
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string>(() => getStoredProjectOverride() || 'prime-sign-454323-a1');
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);

  if (!isOpen) return null;

  const handleSwitchProject = (projId: string) => {
    setActiveProject(projId);
    setStoredProjectOverride(projId);
    setActionSuccessNotice(`Switched active Cloud Project to: ${projId}. Reloading connection...`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleRunMigration = async () => {
    setMigrationProgress({
      status: 'checking',
      message: 'Testing connection to gen-lang-client-0618772940...',
      totalDocs: 0,
      migratedDocs: 0
    });
    const res = await migrateDataToProject('gen-lang-client-0618772940', (p) => {
      setMigrationProgress(p);
    });
    if (res.success) {
      setActionSuccessNotice('Migration to gen-lang-client-0618772940 completed successfully!');
    }
  };

  const handleSwitchEnvironment = (env: AppEnvironment | 'auto') => {
    setEnvironmentOverride(env);
    const updated = detectEnvironment();
    setEnvInfo(updated);
    setActionSuccessNotice(`Switched environment mode to: ${env === 'auto' ? 'Auto-detected (' + updated.envName + ')' : updated.envName}`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
    onDataResetOrImported?.();
  };

  const handleResetData = () => {
    if (confirm(`Reset all test data for "${envInfo.envName}" to default baseline test fixtures?`)) {
      resetEnvironmentToTestData(envInfo.envCode);
      setActionSuccessNotice(`Clean test fixtures seeded for ${envInfo.envName}.`);
      setTimeout(() => setActionSuccessNotice(null), 4000);
      onDataResetOrImported?.();
    }
  };

  const handleExportJson = () => {
    const data = exportEnvironmentData(envInfo.envCode);
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 3000);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importText) as ExportedEnvironmentData;
      const success = importEnvironmentData(parsed, envInfo.envCode);
      if (success) {
        setImportStatus('success');
        setImportText('');
        setActionSuccessNotice('Test dataset successfully imported!');
        setTimeout(() => setActionSuccessNotice(null), 4000);
        onDataResetOrImported?.();
      } else {
        setImportStatus('error');
      }
    } catch {
      setImportStatus('invalid_json');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Environment &amp; Data Storage Manager</span>
              </h2>
              <p className="text-xs text-slate-400">
                Isolated data partitions for AI Studio, Previews, and GitHub deployments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Environment &amp; Storage
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'migration'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>GCP Project &amp; Datastore Migration</span>
          </button>
          <button
            onClick={() => setActiveTab('testdata')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'testdata'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Test Data &amp; Export/Import
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture &amp; Disconnect Guide
          </button>
        </div>

        {/* Banner Alert if Action Succeeded */}
        {actionSuccessNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-6 py-2 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Environment Status Card */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Environment</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      envInfo.envCode === 'aistudio-dev'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : envInfo.envCode === 'aistudio-preview'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                        : envInfo.envCode === 'github-preview'
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {envInfo.envCode}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{envInfo.envName}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5" title={envInfo.hostname}>
                      Hostname: <span className="font-mono text-slate-300">{envInfo.hostname}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {envInfo.dataDescription}
                  </p>
                </div>

                {/* Storage & Cloud Connection Status Card */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Storage Mode</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      connectionState.isConnected
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                    }`}>
                      {connectionState.isConnected ? 'Cloud Firestore Sync' : 'Isolated Test Sandbox'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {connectionState.isConnected ? 'Live Bidirectional Sync' : 'Independent Local Storage'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Storage Prefix: <span className="text-sky-300">{envInfo.storageNamespace}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Firestore Scope: <span className="text-amber-300">{envInfo.firestoreCollectionPrefix || 'root (production)'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      API Key: {envInfo.hasApiKey ? '✅ Configured' : '🔒 Stripped in git (Safe dev mode)'}
                    </span>
                    {onRetryConnection && !connectionState.isConnected && envInfo.hasApiKey && (
                      <button
                        onClick={() => onRetryConnection()}
                        className="px-2 py-0.5 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-600/40 text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        Retry Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Environment Switcher / Simulation */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white">Environment Mode Switcher</span>
                  </div>
                  {envInfo.isSimulatedOverride && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                      Manual Override Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Switch modes to test or verify how the application isolates data and behaves across different deployment channels:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => handleSwitchEnvironment('aistudio-dev')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      envInfo.envCode === 'aistudio-dev'
                        ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>AI Studio Dev</span>
                      {envInfo.envCode === 'aistudio-dev' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Local container &amp; dev server</div>
                  </button>

                  <button
                    onClick={() => handleSwitchEnvironment('aistudio-preview')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      envInfo.envCode === 'aistudio-preview'
                        ? 'bg-purple-950/40 border-purple-500/50 ring-1 ring-purple-500/30'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>AI Studio Preview</span>
                      {envInfo.envCode === 'aistudio-preview' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Shared app URL &amp; stakeholder demo</div>
                  </button>

                  <button
                    onClick={() => handleSwitchEnvironment('github-preview')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      envInfo.envCode === 'github-preview'
                        ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>GitHub Preview</span>
                      {envInfo.envCode === 'github-preview' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">PR preview channels</div>
                  </button>

                  <button
                    onClick={() => handleSwitchEnvironment('github-deployed')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      envInfo.envCode === 'github-deployed'
                        ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>GitHub Live</span>
                      {envInfo.envCode === 'github-deployed' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Live production domain</div>
                  </button>
                </div>

                {envInfo.isSimulatedOverride && (
                  <div className="pt-2 text-right">
                    <button
                      onClick={() => handleSwitchEnvironment('auto')}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
                    >
                      Reset to Auto-Detection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-6">
              {/* Project Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Project Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  activeProject === 'prime-sign-454323-a1'
                    ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/70 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-amber-400 font-bold">Source Project (Current Live Data)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      39 Docs Live
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-mono">prime-sign-454323-a1</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      DB: <span className="text-slate-300">ai-studio-ajwmarineelectri-...</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Currently houses your jobs (2), catalog hardware (23), categories (7), orders (1), specs (1), and users (5).
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => handleSwitchProject('prime-sign-454323-a1')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeProject === 'prime-sign-454323-a1'
                          ? 'bg-amber-500 text-slate-950 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {activeProject === 'prime-sign-454323-a1' ? '✓ Currently Active in App' : 'Use This Project in App'}
                    </button>
                    <a
                      href="https://console.firebase.google.com/project/prime-sign-454323-a1/firestore"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <span>Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Target Project Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  activeProject === 'gen-lang-client-0618772940'
                    ? 'bg-sky-950/30 border-sky-500/50 ring-1 ring-sky-500/30'
                    : 'bg-slate-950/70 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-sky-400 font-bold">Target Project (Requested Destination)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      Destination
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-mono">gen-lang-client-0618772940</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      DB: <span className="text-slate-300">ai-studio-ajwmarineelectri-...</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The target project where you want your live Firestore database to reside.
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => handleSwitchProject('gen-lang-client-0618772940')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeProject === 'gen-lang-client-0618772940'
                          ? 'bg-sky-500 text-slate-950 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {activeProject === 'gen-lang-client-0618772940' ? '✓ Currently Active in App' : 'Use This Project in App'}
                    </button>
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0618772940/firestore"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <span>Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Data Migration Action Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-sky-400" />
                      <span>One-Click Data Migration</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Copy all live records (39 documents backed up from <code className="text-amber-300 font-mono">prime-sign-454323-a1</code>) into <code className="text-sky-300 font-mono">gen-lang-client-0618772940</code>.
                    </p>
                  </div>
                  <button
                    onClick={handleRunMigration}
                    disabled={migrationProgress?.status === 'migrating' || migrationProgress?.status === 'checking'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold transition-all cursor-pointer shadow-lg shadow-sky-950"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${migrationProgress?.status === 'migrating' ? 'animate-spin' : ''}`} />
                    <span>Migrate to gen-lang-client</span>
                  </button>
                </div>

                {migrationProgress && (
                  <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                    migrationProgress.status === 'completed'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : migrationProgress.status === 'error'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span>{migrationProgress.message}</span>
                      {migrationProgress.totalDocs > 0 && (
                        <span>{migrationProgress.migratedDocs} / {migrationProgress.totalDocs}</span>
                      )}
                    </div>
                    {migrationProgress.errorDetail && (
                      <div className="text-[11px] text-rose-300 bg-rose-950/80 p-2.5 rounded border border-rose-800/40 space-y-2">
                        <p>{migrationProgress.errorDetail}</p>
                        <a
                          href="https://console.firebase.google.com/project/gen-lang-client-0618772940/firestore"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-850 text-white font-semibold underline text-[10px]"
                        >
                          <span>Open gen-lang-client-0618772940 in Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions: Create in New Project & Delete Old Datastore */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>How to Complete Project Switch &amp; Delete Old Datastore</span>
                </div>
                <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-white">Step 1: Ensure Firestore is Created on gen-lang-client-0618772940</div>
                    <p className="text-slate-400">
                      Open <a href="https://console.firebase.google.com/project/gen-lang-client-0618772940/firestore" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-mono">Firebase Console</a>, click <strong>Create database</strong> (choose Production mode, region <code className="font-mono text-slate-200">europe-west2</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-white">Step 2: Copy Data with 1 Click or Terminal Script</div>
                    <p className="text-slate-400">
                      Click the <strong className="text-sky-300">"Migrate to gen-lang-client"</strong> button above, or run in terminal:
                    </p>
                    <div className="p-2 rounded bg-slate-950 border border-slate-850 font-mono text-[10px] text-sky-300 flex items-center justify-between">
                      <code>npm run migrate:firestore gen-lang-client-0618772940</code>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <div className="font-semibold text-rose-300 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Step 3: Delete the Old Datastore in prime-sign-454323-a1</span>
                    </div>
                    <p className="text-slate-400">
                      Because cloud resource deletion requires owner-level IAM security credentials, you can safely delete the old datastore in Google Cloud Console or via Cloud Shell:
                    </p>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-rose-300 flex items-center justify-between">
                      <code>gcloud firestore databases delete --database="ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a" --project="prime-sign-454323-a1"</code>
                    </div>
                    <div className="pt-1">
                      <a
                        href="https://console.cloud.google.com/firestore/databases?project=prime-sign-454323-a1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 underline font-semibold text-[11px]"
                      >
                        <span>Open Firestore Databases for prime-sign-454323-a1 in Google Cloud Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testdata' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-sm">Active Test Data Actions</div>
                    <div className="text-[11px] text-slate-400">
                      Manage datasets for <span className="font-semibold text-white">{envInfo.envName}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleResetData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Seed Clean Test Data</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>Export Environment Data</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Export all jobs, catalog specs, postal orders, and vessel specs as JSON to clipboard or backup.
                    </p>
                    <button
                      onClick={handleExportJson}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-semibold transition-all cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Dataset JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Reset Storage Cache</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Clear corrupted local drafts and reload fresh Solent marine electrical baseline specs.
                    </p>
                    <button
                      onClick={handleResetData}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 font-semibold transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset to Clean Fixtures</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Import JSON */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Import Test Data JSON</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Paste JSON exported from another environment (e.g., from AI Studio to GitHub or vice-versa) to clone records into {envInfo.envName}:
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": "1.0.0", "jobs": [...], "catalog": [...]}'
                  rows={4}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                />
                {importStatus === 'invalid_json' && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Invalid JSON format. Please paste a valid export object.</span>
                  </p>
                )}
                {importStatus === 'error' && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Import failed. Ensure the JSON structure contains valid records.</span>
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleImportJson}
                    disabled={!importText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Dataset</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                  <span>Why Did AI Studio Disconnect &amp; How Is It Now Fixed?</span>
                </div>
                <div className="space-y-2 text-slate-300 text-[11px]">
                  <p>
                    <strong>1. The Root Cause:</strong> When you uploaded your code to GitHub, GitHub Secret Scanning flagged the public API key in <code className="text-amber-300 font-mono">firebase-applet-config.json</code>. To allow pushing cleanly without secret leakage, the raw API key was removed from tracked files.
                  </p>
                  <p>
                    <strong>2. GitHub Actions Deployment:</strong> In GitHub Actions CI/CD (<code className="text-sky-300 font-mono">firebase-hosting-merge.yml</code>), your real key was securely injected at build time from <code className="text-emerald-300 font-mono">secrets.VITE_FIREBASE_API_KEY</code>. Thus, the GitHub deployed version had a valid API key and connected reliably!
                  </p>
                  <p>
                    <strong>3. AI Studio Environment:</strong> Because the AI Studio container runs from the git repo without that injected GitHub Actions secret, Firestore previously attempted to authenticate with an empty API key (<code className="font-mono text-slate-400">""</code>), causing the SDK to report offline disconnections.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Cpu className="w-4.5 h-4.5 text-sky-400" />
                  <span>The Best Way to Partition Data Across Environments</span>
                </div>
                <div className="space-y-2 text-slate-300 text-[11px]">
                  <p>
                    To solve this permanently, we implemented **multi-environment storage scoping**:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                    <li>
                      <strong>AI Studio Dev:</strong> Uses its own local test storage (<code className="text-amber-300 font-mono">ajwmes_aistudio_dev_*</code>) with dedicated test vessels, switch panel configs, and diagnostic quotes. It operates in <strong>Isolated Sandbox Mode</strong> with zero disconnect alerts or failures.
                    </li>
                    <li>
                      <strong>GitHub Deployed:</strong> Connects directly to live Firestore with production storage (<code className="text-emerald-300 font-mono">ajwmes_github_live_*</code>) and root collections (<code className="text-emerald-300 font-mono">jobs</code>, <code className="text-emerald-300 font-mono">catalog</code>, <code className="text-emerald-300 font-mono">users</code>).
                    </li>
                    <li>
                      <strong>Preview Mechanism Ready:</strong> When you launch an AI Studio Preview (<code className="text-purple-300 font-mono">ais-pre-*</code>) or GitHub PR preview channel (<code className="text-indigo-300 font-mono">pr-**--*.web.app</code>), the app automatically detects the preview environment, partitions its storage, and provides clean test data so preview testers never overwrite development or production data.
                    </li>
                    <li>
                      <strong>Zero Cross-Contamination:</strong> Any edit or test performed in AI Studio stays in AI Studio and never corrupts your live Solent client data.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Current Environment: <span className="font-semibold text-white">{envInfo.envName}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
