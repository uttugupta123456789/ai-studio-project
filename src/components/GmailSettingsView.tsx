import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Send,
  Sparkles,
  ExternalLink,
  Info,
  Key,
  Database,
  ArrowRight,
  Settings2,
  Copy,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Customer, Product, Enquiry } from '../types';
import { createCustomer, createEnquiry, createCommunication } from '../lib/dataService';
import {
  getEffectiveOAuthClientId,
  getCustomOAuthClientId,
  setCustomOAuthClientId,
} from '../lib/firebase';

interface GmailSettingsViewProps {
  user: User | null;
  isGmailConnected: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSyncGmail: () => void;
  onConnectGmail?: () => void;
  isSyncing: boolean;
  customers: Customer[];
  products: Product[];
  enquiries: Enquiry[];
  onRefresh: () => void;
  onSetManualToken?: (token: string) => void;
}

export const GmailSettingsView: React.FC<GmailSettingsViewProps> = ({
  user,
  isGmailConnected,
  onLogin,
  onLogout,
  onSyncGmail,
  onConnectGmail,
  isSyncing,
  customers,
  products,
  enquiries,
  onRefresh,
  onSetManualToken,
}) => {
  const [manualToken, setManualToken] = useState('');
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  const [activeClientId, setActiveClientId] = useState('');
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [showClientConfig, setShowClientConfig] = useState(false);

  useEffect(() => {
    setActiveClientId(getEffectiveOAuthClientId());
    setCustomClientIdInput(getCustomOAuthClientId());
  }, []);

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomOAuthClientId(customClientIdInput);
    setActiveClientId(getEffectiveOAuthClientId());
    alert('OAuth Client ID saved! You can now click "Connect Gmail Account" to authorize.');
  };

  const handleResetClientId = () => {
    setCustomOAuthClientId('');
    setCustomClientIdInput('');
    setActiveClientId(getEffectiveOAuthClientId());
    alert('Reset to default provisioned OAuth Client ID.');
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const copyOriginToClipboard = () => {
    if (navigator.clipboard && currentOrigin) {
      navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2500);
    }
  };

  // Simulator State for testing the AI Email Extraction pipeline
  const [simSenderName, setSimSenderName] = useState('Ananya Iyer');
  const [simSenderEmail, setSimSenderEmail] = useState('ananya.iyer@gmail.com');
  const [simSubject, setSimSubject] = useState('Enquiry about MacBook Air M3 and Sony XM5 headphones');
  const [simBody, setSimBody] = useState(
    'Hi ElectroSales Team,\n\nI am planning to buy the MacBook Air M3 (16GB RAM) and the Sony WH-1000XM5 headphones for my work-from-home setup. Do you have both items in stock for immediate delivery to Indiranagar, Bengaluru? Also, what would be the total price with applicable store discounts?\n\nThanks,\nAnanya'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSimulateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      // 1. Call AI extraction endpoint
      const res = await fetch('/api/ai/extract-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: simSubject,
          emailBody: simBody,
          senderEmail: simSenderEmail,
          senderName: simSenderName,
          products,
        }),
      });

      if (!res.ok) throw new Error('AI extraction failed');
      const extraction = await res.json();

      // 2. Match or create Customer
      let customer = customers.find((c) => c.email.toLowerCase() === simSenderEmail.toLowerCase());
      if (!customer) {
        customer = await createCustomer({
          name: extraction.customerName || simSenderName,
          email: simSenderEmail,
          notes: `Imported via simulated customer email. Detected interest: ${extraction.detectedProductKeywords?.join(', ') || 'Electronics'}`,
        });
      }

      // 3. Create Enquiry
      const newEnquiry = await createEnquiry({
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        enquiryText: extraction.fullEnquiryText || simBody,
        productId: extraction.matchedProductId || undefined,
        productName: extraction.matchedProductName || undefined,
        source: 'Gmail',
        status: 'Pending',
        receivedAt: new Date().toISOString(),
        gmailMessageId: `sim_${Date.now()}`,
      });

      // 4. Create Communication Log
      await createCommunication({
        customerId: customer.id,
        enquiryId: newEnquiry.id,
        channel: 'Gmail',
        direction: 'Incoming',
        subject: simSubject,
        messageBody: simBody,
        status: 'Received',
        gmailMessageId: newEnquiry.gmailMessageId,
        sentOrReceivedAt: new Date().toISOString(),
      });

      setSimulationResult({
        customer,
        enquiry: newEnquiry,
        extraction,
      });

      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          Gmail Integration & Synchronization
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect your Google Workspace / Gmail account to ingest customer enquiries and send AI-drafted replies
        </p>
      </div>

      {/* Status Banner: Project gen-lang-client-0830828883 Linked */}
      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold text-emerald-200 text-sm flex items-center gap-2">
              <span>Google Cloud Project Linked: gen-lang-client-0830828883</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                Active Client ID
              </span>
            </h3>
            <p className="text-emerald-300/90 leading-relaxed text-xs">
              Your application is now directly configured with Google OAuth in project <strong className="text-white">gen-lang-client-0830828883</strong> for user <strong className="text-white">uttugupta123456789@gmail.com</strong>.
            </p>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-slate-300 text-[11px] flex flex-wrap items-center justify-between gap-2 font-mono">
              <div>
                Active Client ID: <span className="text-emerald-400 font-bold">845877115570-37ig1...apps.googleusercontent.com</span>
              </div>
              <div className="text-slate-400 text-[10px]">
                Authorized Scopes: gmail.modify, gmail.readonly, gmail.send
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isGmailConnected
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Gmail API Connection
                {isGmailConnected ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active & Authorized
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Authorization Required
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isGmailConnected
                  ? `Authorized for Gmail syncing. Staff account: ${user?.email || 'Logged in'}`
                  : user
                  ? `Signed in as staff (${user.email}). Click "Connect Gmail Account" to grant Gmail access.`
                  : 'Sign in with your Google staff account or click "Connect Gmail Account".'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isGmailConnected ? (
              <>
                <button
                  type="button"
                  onClick={onSyncGmail}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Scanning Gmail...' : 'Sync Recent Emails'}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onConnectGmail) {
                      onConnectGmail();
                    } else {
                      onLogin();
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-white" />
                  Connect Gmail Account
                </button>
                {!user && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="px-3 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    Staff Sign In
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowClientConfig(!showClientConfig)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                  {showClientConfig ? 'Hide Config' : 'Configure Client ID'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualTokenInput(!showManualTokenInput)}
                  className="text-[11px] text-slate-400 hover:text-indigo-300 underline ml-1"
                >
                  {showManualTokenInput ? 'Hide token' : 'Paste token'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* OAuth Client ID Configuration Box */}
        {showClientConfig && (
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                Custom OAuth Client ID (for project gen-lang-client-0830828883)
              </span>
              <button
                type="button"
                onClick={handleResetClientId}
                className="text-[11px] text-slate-400 hover:text-rose-300 underline"
              >
                Reset to default
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Active Client ID being sent: <code className="text-indigo-300 font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded break-all">{activeClientId || 'None'}</code>
            </p>
            <form onSubmit={handleSaveCustomClientId} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customClientIdInput}
                onChange={(e) => setCustomClientIdInput(e.target.value)}
                placeholder="e.g. 845877115570-xxxx.apps.googleusercontent.com"
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Save Client ID
              </button>
            </form>
          </div>
        )}

        {/* Manual Token Input (Fallback / Instant Dev Option) */}
        {showManualTokenInput && !isGmailConnected && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              Manual OAuth Bearer Token (Instant Test Option)
            </span>
            <p className="text-[11px] text-slate-400">
              Paste a Google OAuth access token with <code className="text-amber-300">gmail.readonly</code> scope to test sync immediately without touching credentials:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="ya29.a0Ac..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualToken.trim() && onSetManualToken) {
                    onSetManualToken(manualToken.trim());
                    setManualToken('');
                    setShowManualTokenInput(false);
                  }
                }}
                disabled={!manualToken.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Apply Token
              </button>
            </div>
          </div>
        )}

        {/* Scopes Overview */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">gmail.readonly Scope</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Allows reading customer enquiry emails, sender name, subject, and message content to detect sales opportunities.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">gmail.send Scope</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Allows sending approved AI-drafted responses directly from your store's Gmail address upon staff confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator: Test Incoming Email & AI Extraction Pipeline */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Interactive Email Pipeline Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Test the end-to-end workflow: simulate receiving a customer email, AI enquiry extraction, auto-matching with catalog products, and creating customer records.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimulateEmail} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer / Sender Name</label>
              <input
                type="text"
                required
                value={simSenderName}
                onChange={(e) => setSimSenderName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer Email Address</label>
              <input
                type="email"
                required
                value={simSenderEmail}
                onChange={(e) => setSimSenderEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Subject Line</label>
            <input
              type="text"
              required
              value={simSubject}
              onChange={(e) => setSimSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Body Content</label>
            <textarea
              rows={4}
              required
              value={simBody}
              onChange={(e) => setSimBody(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isSimulating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing through AI Pipeline...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Simulate Incoming Email & Process with AI
              </>
            )}
          </button>
        </form>

        {/* Simulation Output Card */}
        {simulationResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Email Processed & Saved Successfully</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Matched/Created Customer:</span>
                <p className="font-medium text-slate-200">
                  {simulationResult.customer.name} ({simulationResult.customer.email})
                </p>
              </div>
              <div>
                <span className="text-slate-500">Created Enquiry ID:</span>
                <p className="font-mono text-indigo-400">{simulationResult.enquiry.id}</p>
              </div>
              <div>
                <span className="text-slate-500">AI Identified Product:</span>
                <p className="font-medium text-slate-200">
                  {simulationResult.extraction.matchedProductName || 'General Inquiry'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Sales Confidence Score:</span>
                <p className="font-medium text-emerald-400">
                  {Math.round((simulationResult.extraction.confidenceScore || 0.95) * 100)}%
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              The enquiry is now listed under <strong>Enquiries</strong> with status{' '}
              <strong className="text-amber-400">Pending</strong>. You can click "Draft AI Response" to review and send a reply!
            </p>
          </div>
        )}
      </div>

      {/* Cloud Console Setup Instructions */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          Google Cloud & Gmail API Configuration Guide
        </h3>
        <p className="text-slate-300 leading-relaxed">
          Google Workspace OAuth credentials have been provisioned for this application on project{' '}
          <strong className="text-indigo-400 font-mono">gen-lang-client-0830828883</strong>.
        </p>

        <div className="space-y-2 text-slate-400 text-[11px]">
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-200">1.</span>
            <span>
              Sign in with your Google account via the button in the top navigation bar.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-200">2.</span>
            <span>
              Consent to the requested Gmail permissions (<strong className="text-slate-300">gmail.readonly</strong> and <strong className="text-slate-300">gmail.send</strong>).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-200">3.</span>
            <span>
              Use the <strong className="text-slate-300">Sync Recent Emails</strong> button to poll your inbox for customer sales queries.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-200">4.</span>
            <span>
              All incoming messages are classified by the Gemini AI engine, mapped to store products, and staged for staff approval before sending any email response.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
