import React, { useState } from 'react';
import {
  Users,
  Package,
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Search,
  Mail,
  Send,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Customer, Product, Enquiry, Communication, DashboardStats } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  customers: Customer[];
  products: Product[];
  enquiries: Enquiry[];
  communications: Communication[];
  user?: User | null;
  isGmailConnected?: boolean;
  accessToken?: string | null;
  onLogin?: () => void;
  onConnectGmail?: () => void;
  onSyncGmail?: () => void;
  isSyncing?: boolean;
  onOpenDraftReply: (enquiry: Enquiry) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectProduct: (product: Product) => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onQuickAiQuery: (prompt: string) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  customers,
  products,
  enquiries,
  communications,
  user,
  isGmailConnected = false,
  accessToken,
  onLogin,
  onConnectGmail,
  onSyncGmail,
  isSyncing = false,
  onOpenDraftReply,
  onSelectCustomer,
  onSelectProduct,
  onSelectEnquiry,
  onQuickAiQuery,
  setActiveTab,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [testState, setTestState] = useState<{
    loading: boolean;
    tested: boolean;
    success: boolean;
    data?: any;
    error?: string;
  }>({
    loading: false,
    tested: false,
    success: false,
  });

  const handleTestConnection = async () => {
    setTestState({ loading: true, tested: false, success: false });
    try {
      if (!accessToken) {
        setTestState({
          loading: false,
          tested: true,
          success: false,
          error:
            'No active Google OAuth access token detected. Please click "Connect & Authenticate with Google" below.',
        });
        return;
      }

      const res = await fetch('/api/gmail/test-connection', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.connected) {
        setTestState({
          loading: false,
          tested: true,
          success: true,
          data,
        });
      } else {
        setTestState({
          loading: false,
          tested: true,
          success: false,
          error: data.error || 'Failed to verify Gmail API profile.',
        });
      }
    } catch (err: any) {
      setTestState({
        loading: false,
        tested: true,
        success: false,
        error: err.message || 'Network error while testing connection.',
      });
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPrompt.trim()) {
      onQuickAiQuery(quickPrompt.trim());
      setQuickPrompt('');
    }
  };

  const getStatusBadge = (status: Enquiry['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            In Progress
          </span>
        );
      case 'Responded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            Responded
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & AI Prompt Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            AI-Powered Electronics Sales Assistant
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
            Electronics Store Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
            Monitor incoming customer enquiries from Gmail and store visits, analyze catalogue inventory, and generate instant AI sales email replies with real stock pricing.
          </p>

          {/* Quick AI Search Form */}
          <form onSubmit={handleQuickSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Ask AI: e.g. 'Show pending enquiries', 'Which customers asked for laptops?', 'Laptops under ₹50,000'"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-md shadow-indigo-600/20"
            >
              <span>Ask AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick suggestion pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="font-medium text-slate-400">Quick prompts:</span>
            {[
              'Show all pending enquiries',
              'What products are available below ₹50,000?',
              'Which customers asked about laptops?',
              'Find customers who have not received a response'
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onQuickAiQuery(prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gmail Account Integration & Live Tested Status Card */}
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-xl relative overflow-hidden backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-slate-100">
                  Google Workspace Gmail Integration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  uttugupta123456789@gmail.com
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Linked to AI Studio Google Project: <span className="font-mono text-indigo-400">gen-lang-client-0830828883</span>
              </p>
            </div>
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isGmailConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Connected & Authorized
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Authentication Ready
              </span>
            )}
          </div>
        </div>

        {/* Account Details & Diagnostic Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block mb-1">Target Google Account</span>
            <span className="font-semibold text-slate-200 font-mono flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              uttugupta123456789@gmail.com
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block mb-1">OAuth Client ID Status</span>
            <span className="font-semibold text-emerald-400 font-mono text-[11px] truncate block" title="845877115570-37ig1hg3383aiof01c0l70orgudj3lr8.apps.googleusercontent.com">
              845877115570-37ig1...apps.googleusercontent.com
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block mb-1">Active Scopes</span>
            <span className="font-medium text-slate-300 text-[11px]">
              gmail.modify, gmail.readonly, gmail.send
            </span>
          </div>
        </div>

        {/* Live Tested Status Box */}
        {testState.tested && (
          <div
            className={`p-3.5 rounded-xl border mb-4 text-xs transition-all ${
              testState.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {testState.success ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Current Tested Status: Live Gmail API Verified Successfully</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-emerald-200/90 font-mono">
                  <div>Mailbox: <span className="text-white font-bold">{testState.data?.emailAddress || 'uttugupta123456789@gmail.com'}</span></div>
                  <div>Total Emails: <span className="text-white font-bold">{testState.data?.messagesTotal ?? 'Active'}</span></div>
                  <div>Threads: <span className="text-white font-bold">{testState.data?.threadsTotal ?? 'Active'}</span></div>
                  <div>Tested At: <span className="text-white font-bold">{testState.data?.testedAt ? new Date(testState.data.testedAt).toLocaleTimeString() : 'Now'}</span></div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">Connection Test Diagnostics:</span>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">{testState.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Direct Authentication & Testing Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {!isGmailConnected ? (
            <button
              type="button"
              onClick={() => {
                if (onConnectGmail) onConnectGmail();
                else if (onLogin) onLogin();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-md shadow-white/10"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.02h3.88c2.27-2.09 3.66-5.17 3.66-9.11z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.11C3.28 21.37 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.3c-.25-.72-.38-1.49-.38-2.3s.13-1.58.38-2.3V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.11z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.28 2.63 1.26 6.59l4.02 3.11c.95-2.83 3.6-4.95 6.72-4.95z"
                />
              </svg>
              <span>Connect & Authenticate with Google (uttugupta123456789@gmail.com)</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSyncGmail}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Enquiries...' : 'Sync Gmail Enquiries Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onConnectGmail) onConnectGmail();
                  else if (onLogin) onLogin();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <span>Re-Authenticate Session</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testState.loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/90 hover:bg-slate-750 text-indigo-300 border border-indigo-500/30 transition-colors disabled:opacity-50"
          >
            {testState.loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{testState.loading ? 'Testing Live API...' : 'Test Current Status'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors ml-auto"
          >
            <span>Gmail Configuration & Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Customers</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalCustomers}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Registered customer profiles</span>
          </div>
        </div>

        {/* Products in Catalogue */}
        <div
          onClick={() => setActiveTab('products')}
          className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Products Catalog</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalProducts}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>{stats.availableProducts} In Stock & Ready</span>
          </div>
        </div>

        {/* Total Enquiries */}
        <div
          onClick={() => setActiveTab('enquiries')}
          className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4.5 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Enquiries</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalEnquiries}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>{stats.respondedEnquiries} responded · {stats.closedEnquiries} closed</span>
          </div>
        </div>

        {/* Enquiries Awaiting Response */}
        <div
          onClick={() => setActiveTab('enquiries')}
          className="bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 rounded-xl p-4.5 cursor-pointer transition-all shadow-xs group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Awaiting Response</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.awaitingResponseCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span className="text-amber-400">{stats.pendingEnquiries} pending</span>
            <span>· {stats.inProgressEnquiries} in progress</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Enquiries & Recent Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enquiries (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-100">Recent Customer Enquiries</h3>
            </div>
            <button
              onClick={() => setActiveTab('enquiries')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all ({enquiries.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Enquiry / Subject</th>
                  <th className="px-4 py-3">Related Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {enquiries.slice(0, 5).map((enq) => {
                  return (
                    <tr key={enq.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{enq.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            enq.source === 'Gmail' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {enq.source}
                          </span>
                          <span>{new Date(enq.receivedAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-slate-300 truncate font-normal">
                          {enq.enquiryText}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <span className="text-slate-300 truncate block">
                          {enq.productName || 'General Enquiry'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(enq.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectEnquiry(enq)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onOpenDraftReply(enq)}
                            className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            Draft Reply
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {enquiries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No customer enquiries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Communication Activity (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-100">Communication Activity</h3>
            </div>
            <button
              onClick={() => setActiveTab('communications')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              All Logs
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3.5 overflow-y-auto max-h-[380px]">
            {communications.slice(0, 6).map((comm) => {
              const isIncoming = comm.direction === 'Incoming';
              return (
                <div
                  key={comm.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                      isIncoming ? 'text-blue-400' : 'text-emerald-400'
                    }`}>
                      {isIncoming ? (
                        <>
                          <Mail className="w-3 h-3" /> Incoming Email
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" /> Sent Response
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comm.sentOrReceivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="font-medium text-slate-200 line-clamp-1">
                    {comm.subject || '(No Subject)'}
                  </p>
                  <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                    {comm.messageBody}
                  </p>
                </div>
              );
            })}

            {communications.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                No communications logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
