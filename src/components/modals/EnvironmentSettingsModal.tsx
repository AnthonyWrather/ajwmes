import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Layers, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Eye,
  EyeOff,
  GitBranch,
  Cpu,
  Copy,
  Check,
  Key,
  ExternalLink
} from 'lucide-react';
import { 
  detectEnvironment, 
  setEnvironmentOverride, 
  getEnvironmentBadge,
  AppEnvironment, 
  EnvironmentInfo 
} from '../../lib/environment';
import { APP_VERSION, RELEASE_CHANNEL, RELEASE_BUILD_DATE } from '../../version';
import { 
  exportEnvironmentData, 
  importEnvironmentData, 
  resetEnvironmentToTestData, 
  ExportedEnvironmentData 
} from '../../lib/envStorage';
import { 
  firebaseConfig, 
  getCustomApiKey, 
  setCustomApiKey, 
  DEFAULT_API_KEY, 
  isValidApiKey, 
  clearCustomFirebaseConfig, 
  tryAutoFetchHostingConfig 
} from '../../lib/firebaseConfig';
import { FirestoreConnectionState } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'testdata' | 'guide'>('overview');
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    const trimmed = customKeyInput.trim();
    if (!isValidApiKey(trimmed)) {
      setKeyNotice('Error: Key must start with "AIza..." and be a valid Google/Firebase Web API key.');
      return;
    }
    setCustomApiKey(trimmed);
    setKeyNotice('✅ Firebase Web API Key saved! Reloading application...');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleResetDefaultApiKey = () => {
    setCustomApiKey(DEFAULT_API_KEY);
    setKeyNotice('✅ Reset to verified default Firebase API key! Reloading...');
    setTimeout(() => window.location.reload(), 800);
  };

  const handleAutoDetectHostingConfig = async () => {
    setKeyNotice('Querying Firebase Hosting reserved endpoint (/__/firebase/init.json)...');
    try {
      const detected = await tryAutoFetchHostingConfig();
      if (detected?.apiKey) {
        setCustomApiKey(detected.apiKey);
        setKeyNotice(`✅ Auto-detected hosting key for project "${detected.projectId || 'Firebase'}"! Reloading...`);
        setTimeout(() => window.location.reload(), 800);
      } else {
        setKeyNotice('No init.json found on this domain. Please paste your Firebase Web API Key manually.');
      }
    } catch {
      setKeyNotice('Failed to auto-detect hosting config. Please paste key manually.');
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white">
                  Multi-Environment &amp; Release Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500/40 text-[10px] font-mono text-sky-300 font-bold">
                  v{APP_VERSION}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 capitalize">
                  {RELEASE_CHANNEL}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track releases across AI Studio Dev, Shared Preview, PR Staging, and Production Live (Build: {RELEASE_BUILD_DATE})
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

              {/* Firebase Project & Web API Key Management Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white">Firebase Project &amp; Web API Key Diagnostics</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-mono text-[10px]">
                    Project: {firebaseConfig.projectId}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Resolves <code className="text-amber-300 font-mono">auth/api-key-not-valid</code> errors when deployed to Firebase.
                  Ensure you are using the <strong>Firebase Web API Key</strong> from the Firebase Console, not a Google Gemini AI Studio key.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Active Web App ID:</span>
                    <span className="font-mono text-slate-200 select-all truncate block">{firebaseConfig.appId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Auth Domain:</span>
                    <span className="font-mono text-slate-200 select-all truncate block">{firebaseConfig.authDomain}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Active Web API Key:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sky-300 text-[11px]">
                        {showKeySecret 
                          ? firebaseConfig.apiKey 
                          : `${firebaseConfig.apiKey.slice(0, 8)}••••••••••••${firebaseConfig.apiKey.slice(-4)}`
                        }
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowKeySecret(!showKeySecret)}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        title={showKeySecret ? 'Hide Key' : 'Reveal Key'}
                      >
                        {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Overwrite Input */}
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Update or Override Web API Key for this Browser:
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      placeholder="Paste your Firebase Web API Key (AIzaSy...)"
                      className="flex-1 w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        disabled={!customKeyInput.trim()}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
                      >
                        Save Key
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoDetectHostingConfig}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
                        title="Auto-detect from /__/firebase/init.json on Firebase Hosting"
                      >
                        Auto-Detect
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDefaultApiKey}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
                        title="Reset to default authentic Firebase key"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>
                  {keyNotice && (
                    <div className="text-[11px] text-amber-300 font-medium">
                      {keyNotice}
                    </div>
                  )}
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
