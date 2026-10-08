import React, { useState } from 'react';
import { Github, Globe, Cloud, Check, Copy, X, Terminal, ExternalLink } from 'lucide-react';

interface FreeHostingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeHostingGuideModal: React.FC<FreeHostingGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'github_actions' | 'custom_domain'>('firebase');
  const [copiedText, setCopiedText] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const firebaseCommands = `# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to your Google account that owns "AJW Marine Electrical Services"
firebase login

# 3. Check your project ID and connect to it
firebase projects:list
firebase use ajw-marine-electrical-services

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
2. Click "Add custom domain" (e.g. ajwmarine.co.uk or www.ajwmarine.co.uk).
3. Follow the DNS instructions to add the 2 A-records or TXT record with your domain provider.
4. Firebase provisions your SSL certificate automatically within 24 hours.`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-6 text-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
              100% Free Hosting &amp; GitHub Setup
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              How to Host AJWMES Free Forever
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'firebase' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>1. CLI Deploy (Fastest)</span>
          </button>
          <button
            onClick={() => setActiveTab('github_actions')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'github_actions' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>2. GitHub Auto-Deploy</span>
          </button>
          <button
            onClick={() => setActiveTab('custom_domain')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'custom_domain' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Custom Domain</span>
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
                onClick={() => copyToClipboard(firebaseCommands, 'fb_cmds')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1"
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
                onClick={() => copyToClipboard(githubActionsSteps, 'gh_steps')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1"
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
              Connect your branded business domain (e.g. <span className="text-white font-semibold">ajwmarine.co.uk</span>) with free automatic SSL:
            </p>
            <div className="relative bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] text-sky-300">
              <pre className="overflow-x-auto whitespace-pre-wrap">{domainSteps}</pre>
              <button
                onClick={() => copyToClipboard(domainSteps, 'domain_steps')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px] font-sans flex items-center gap-1"
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

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
