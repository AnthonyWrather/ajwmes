import React, { useState } from 'react';
import { Github, Globe, Cloud, Check, Copy, X, Terminal, ExternalLink, Key } from 'lucide-react';

interface FreeHostingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeHostingGuideModal: React.FC<FreeHostingGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'github_actions' | 'custom_domain' | 'auth_troubleshoot'>('firebase');
  const [copiedText, setCopiedText] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch((err) => {
      console.warn('Clipboard write deferred:', err);
    });
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const firebaseCommands = `# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to your Google account that owns "AJW Marine Electrical Services"
firebase login

# 3. Check your project ID and connect to it
firebase projects:list
firebase use gen-lang-client-0618772940

# 4. Build and deploy live
npm run build
firebase deploy --only hosting`;

  const githubActionsSteps = `# To enable automatic deployment on every git push:
1. In your local repository terminal, run:
   firebase init hosting:github

2. When asked:
   - "For which GitHub repository?": Enter your github repo name (e.g. anthonywrather/ajwmes)
   - "Run build script before deploy?": Yes (npm ci && npm run build)
   - "Deploy to live channel on merge?": Yes (main branch)

3. Push your code:
   git add .
   git commit -m "Configure Firebase hosting & GitHub workflow"
   git push origin main

GitHub will automatically build and deploy your site on every push!`;

  const domainSteps = `1. In the Firebase Console, go to Build -> Hosting.
2. Click "Add custom domain" (e.g. ajwmes.co.uk or www.ajwmes.co.uk).
3. Follow the DNS instructions to add the 2 A-records or TXT record with your domain provider.
4. Firebase provisions your SSL certificate automatically within 24 hours.`;

  const authSecretSteps = `# In GitHub repository settings (Settings > Secrets and variables > Actions):
Add repository secret:
VITE_FIREBASE_API_KEY = AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg

# In Firebase Console (Authentication > Settings > Authorized domains):
Add your custom or preview domain:
- gen-lang-client-0618772940.web.app
- gen-lang-client-0618772940.firebaseapp.com
- ajwmes.co.uk`;

  return (
    <div data-testid="free-hosting-guide-modal" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-4 sm:p-6 text-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
              100% Free Hosting &amp; GitHub Setup
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              How to Host AJWMES Free Forever
            </h3>
          </div>
          <button
            type="button"
            data-testid="close-hosting-guide-modal"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            data-testid="hosting-tab-firebase"
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'firebase' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>1. CLI Deploy (Fastest)</span>
          </button>
          <button
            type="button"
            data-testid="hosting-tab-github"
            onClick={() => setActiveTab('github_actions')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'github_actions' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>2. GitHub Auto-Deploy</span>
          </button>
          <button
            type="button"
            data-testid="hosting-tab-custom-domain"
            onClick={() => setActiveTab('custom_domain')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'custom_domain' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Custom Domain</span>
          </button>
          <button
            type="button"
            data-testid="hosting-tab-auth"
            onClick={() => setActiveTab('auth_troubleshoot')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'auth_troubleshoot' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>4. Auth &amp; API Key</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'firebase' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Run these commands in your local terminal to deploy directly to your <strong>AJW Marine Electrical Services</strong> Firebase Hosting:
            </p>
            <div className="relative bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] text-sky-300">
              <pre className="overflow-x-auto whitespace-pre-wrap">{firebaseCommands}</pre>
              <button
                type="button"
                data-testid="copy-cli-commands-button"
                onClick={() => copyToClipboard(firebaseCommands, 'fb_cmds')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1 cursor-pointer"
              >
                {copiedText === 'fb_cmds' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText === 'fb_cmds' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              ✓ Instant HTTPS deployment &nbsp; ✓ Free *.web.app &amp; *.firebaseapp.com URLs &nbsp; ✓ Fully mobile PWA compliant
            </p>
          </div>
        )}

        {activeTab === 'github_actions' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              We have already added <code className="text-sky-400 bg-slate-950 px-1 py-0.5 rounded">firebase.json</code> and <code className="text-sky-400 bg-slate-950 px-1 py-0.5 rounded">.github/workflows/firebase-hosting-merge.yml</code> to your repository. To connect continuous deployment:
            </p>
            <div className="relative bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] text-sky-300">
              <pre className="overflow-x-auto whitespace-pre-wrap">{githubActionsSteps}</pre>
              <button
                type="button"
                data-testid="copy-github-steps-button"
                onClick={() => copyToClipboard(githubActionsSteps, 'gh_steps')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1 cursor-pointer"
              >
                {copiedText === 'gh_steps' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText === 'gh_steps' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              ✓ Automatic CI/CD build &amp; deploy on every git commit &nbsp; ✓ Zero manual uploads required
            </p>
          </div>
        )}

        {activeTab === 'custom_domain' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Connect your branded business domain (e.g. <span className="text-white font-semibold">ajwmes.co.uk</span>) with free automatic SSL:
            </p>
            <div className="relative bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] text-sky-300">
              <pre className="overflow-x-auto whitespace-pre-wrap">{domainSteps}</pre>
              <button
                type="button"
                data-testid="copy-domain-steps-button"
                onClick={() => copyToClipboard(domainSteps, 'domain_steps')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1 cursor-pointer"
              >
                {copiedText === 'domain_steps' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText === 'domain_steps' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              ✓ Free SSL certificate by Google &nbsp; ✓ Global CDN edge network &nbsp; ✓ Zero renewal costs
            </p>
          </div>
        )}

        {activeTab === 'auth_troubleshoot' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              If you receive <code className="text-amber-300 font-mono">auth/api-key-not-valid</code> when signing in on Firebase Hosting:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
              <div className="font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                <span>Firebase Web API Key vs Gemini Key</span>
              </div>
              <p className="text-slate-400">
                A Gemini AI Studio key (<code className="text-slate-300 font-mono">aistudio.google.com/apikey</code>) only works with generative AI endpoints. Firebase Authentication requires the <strong>Firebase Web API Key</strong> from your Firebase project.
              </p>
              <div className="pt-1">
                <span className="text-white font-semibold">1. Web API Key for gen-lang-client-0618772940:</span>
                <div className="mt-1 flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 font-mono text-sky-300 text-[11px]">
                  <span>AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg</span>
                  <button
                    type="button"
                    data-testid="copy-auth-key-button"
                    onClick={() => copyToClipboard('AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg', 'api_key_val')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] flex items-center gap-1 font-sans cursor-pointer"
                  >
                    {copiedText === 'api_key_val' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'api_key_val' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] text-sky-300">
              <pre className="overflow-x-auto whitespace-pre-wrap">{authSecretSteps}</pre>
              <button
                type="button"
                data-testid="copy-auth-steps-button"
                onClick={() => copyToClipboard(authSecretSteps, 'auth_steps')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1 cursor-pointer"
              >
                {copiedText === 'auth_steps' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText === 'auth_steps' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            data-testid="hosting-guide-close-button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
