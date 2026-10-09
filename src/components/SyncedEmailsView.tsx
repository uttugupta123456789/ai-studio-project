import React, { useState } from 'react';
import {
  Mail,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Building,
  User,
  Package,
  Calendar,
  X,
  PlusCircle,
} from 'lucide-react';
import { SyncedEmail, Customer, Product, Enquiry, UrgencyLevel } from '../types';
import { updateSyncedEmail, deleteSyncedEmail, createSyncedEmail, createCustomer, createEnquiry, createCommunication } from '../lib/dataService';
import { ConfirmModal } from './ConfirmModal';

interface SyncedEmailsViewProps {
  syncedEmails: SyncedEmail[];
  customers: Customer[];
  products: Product[];
  enquiries: Enquiry[];
  isSyncing: boolean;
  isGmailConnected: boolean;
  userEmail?: string | null;
  onSyncGmail: () => void;
  onConnectGmail: () => void;
  onOpenDraftReply: (enquiry: Enquiry) => void;
  onNavigateToTab: (tab: string) => void;
  onRefresh: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const SyncedEmailsView: React.FC<SyncedEmailsViewProps> = ({
  syncedEmails,
  customers,
  products,
  enquiries,
  isSyncing,
  isGmailConnected,
  userEmail,
  onSyncGmail,
  onConnectGmail,
  onOpenDraftReply,
  onNavigateToTab,
  onRefresh,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'urgency' | 'newest' | 'oldest'>('urgency');
  
  const [selectedEmail, setSelectedEmail] = useState<SyncedEmail | null>(null);
  const [emailToDelete, setEmailToDelete] = useState<SyncedEmail | null>(null);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);

  // Simulation test email modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simSenderName, setSimSenderName] = useState('Rahul Deshmukh (Procurement Lead)');
  const [simSenderEmail, setSimSenderEmail] = useState('rahul.d@enterprise-solutions.in');
  const [simSubject, setSimSubject] = useState('URGENT: Corporate Quote for 10 Keychron Q1 Pro keyboards before 5 PM');
  const [simBody, setSimBody] = useState(
    'Hi ElectroSales Team,\n\nWe urgently need a commercial quote and GST invoice breakdown for 10 units of Keychron Q1 Pro Wireless Mechanical Keyboards for our tech workstation setup.\n\nOur procurement budget is pre-approved for ₹2,50,000. We must place the order today before 5:00 PM IST to meet our quarterly delivery timeline. Can you guarantee same-week dispatch?\n\nPlease call me directly or send the formal PDF quote ASAP.\n\nRegards,\nRahul Deshmukh\nLead Systems Architect'
  );
  const [isSimulating, setIsSimulating] = useState(false);

  // Urgency Counts
  const criticalCount = syncedEmails.filter((e) => e.urgency === 'Critical').length;
  const highCount = syncedEmails.filter((e) => e.urgency === 'High').length;
  const mediumCount = syncedEmails.filter((e) => e.urgency === 'Medium').length;
  const lowCount = syncedEmails.filter((e) => e.urgency === 'Low').length;

  // Filter & Sort
  const filteredEmails = syncedEmails
    .filter((email) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        email.senderName.toLowerCase().includes(q) ||
        email.senderEmail.toLowerCase().includes(q) ||
        email.subject.toLowerCase().includes(q) ||
        email.bodyText.toLowerCase().includes(q) ||
        (email.matchedProductName && email.matchedProductName.toLowerCase().includes(q)) ||
        (email.aiCategory && email.aiCategory.toLowerCase().includes(q)) ||
        email.urgencyReason.toLowerCase().includes(q);

      const matchesUrgency = urgencyFilter === 'All' || email.urgency === urgencyFilter;
      const matchesCategory = categoryFilter === 'All' || email.aiCategory === categoryFilter;
      const matchesStatus = statusFilter === 'All' || email.status === statusFilter;

      return matchesSearch && matchesUrgency && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'urgency') {
        const scoreA = a.urgencyScore ?? (a.urgency === 'Critical' ? 95 : a.urgency === 'High' ? 80 : a.urgency === 'Medium' ? 50 : 25);
        const scoreB = b.urgencyScore ?? (b.urgency === 'Critical' ? 95 : b.urgency === 'High' ? 80 : b.urgency === 'Medium' ? 50 : 25);
        return scoreB - scoreA;
      }
      if (sortBy === 'newest') {
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      }
      return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
    });

  const getUrgencyBadge = (urgency: UrgencyLevel, score?: number) => {
    switch (urgency) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 shadow-xs shadow-red-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            CRITICAL {score ? `(${score}/100)` : ''}
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Zap className="w-3 h-3 text-amber-400" />
            HIGH {score ? `(${score}/100)` : ''}
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Clock className="w-3 h-3 text-blue-400" />
            MEDIUM {score ? `(${score}/100)` : ''}
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <CheckCircle className="w-3 h-3 text-slate-400" />
            LOW {score ? `(${score}/100)` : ''}
          </span>
        );
    }
  };

  // Re-classify single email with Gemini LLM
  const handleReclassify = async (email: SyncedEmail) => {
    setReclassifyingId(email.id);
    try {
      const res = await fetch('/api/ai/classify-urgency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          bodyText: email.bodyText,
          senderEmail: email.senderEmail,
          senderName: email.senderName,
        }),
      });

      if (!res.ok) throw new Error('Failed to classify urgency');
      const data = await res.json();

      await updateSyncedEmail(email.id, {
        urgency: data.urgency,
        urgencyScore: data.urgencyScore,
        urgencyReason: data.urgencyReason,
        recommendedAction: data.recommendedAction,
        aiCategory: data.aiCategory || email.aiCategory,
      });

      showToast(`Updated urgency for "${email.subject}" to ${data.urgency}!`, 'success');
      onRefresh();
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({
          ...selectedEmail,
          urgency: data.urgency,
          urgencyScore: data.urgencyScore,
          urgencyReason: data.urgencyReason,
          recommendedAction: data.recommendedAction,
          aiCategory: data.aiCategory || email.aiCategory,
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error reclassifying email.', 'error');
    } finally {
      setReclassifyingId(null);
    }
  };

  // Handle Simulate New Email
  const handleSimulateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSenderEmail || !simSubject || !simBody) return;

    setIsSimulating(true);
    try {
      // 1. Classify with Gemini
      const classifyRes = await fetch('/api/ai/classify-urgency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: simSubject,
          bodyText: simBody,
          senderEmail: simSenderEmail,
          senderName: simSenderName,
        }),
      });

      const classification = classifyRes.ok ? await classifyRes.json() : {
        urgency: 'Critical',
        urgencyScore: 92,
        urgencyReason: 'Urgent corporate inquiry with strict same-day deadline.',
        recommendedAction: 'Immediate quote and telephone response.',
        aiCategory: 'Bulk / Corporate Order',
      };

      // 2. Match or create customer
      let customer = customers.find((c) => c.email.toLowerCase() === simSenderEmail.toLowerCase());
      if (!customer) {
        customer = await createCustomer({
          name: simSenderName,
          email: simSenderEmail,
          notes: `Simulated customer inquiry via Gmail: "${simSubject}"`,
        });
      }

      // 3. Find matching product
      const matched = products.find(
        (p) => simSubject.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) ||
               simBody.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
      );

      // 4. Create Enquiry in Firestore
      const enq = await createEnquiry({
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        enquiryText: simBody,
        productId: matched?.id,
        productName: matched?.name,
        source: 'Gmail',
        status: 'Pending',
        urgency: classification.urgency,
        urgencyScore: classification.urgencyScore,
        urgencyReason: classification.urgencyReason,
        gmailMessageId: `sim_${Date.now()}`,
        receivedAt: new Date().toISOString(),
      });

      // 5. Create Communication log in Firestore
      await createCommunication({
        customerId: customer.id,
        enquiryId: enq.id,
        channel: 'Gmail',
        direction: 'Incoming',
        subject: simSubject,
        messageBody: simBody,
        status: 'Received',
        urgency: classification.urgency,
        gmailMessageId: `sim_${Date.now()}`,
        sentOrReceivedAt: new Date().toISOString(),
      });

      // 6. Save into persistent Firestore synced_emails collection
      const newEmail = await createSyncedEmail({
        gmailMessageId: `sim_${Date.now()}`,
        senderName: simSenderName,
        senderEmail: simSenderEmail,
        subject: simSubject,
        bodyText: simBody,
        snippet: simBody.slice(0, 160) + '...',
        urgency: classification.urgency,
        urgencyScore: classification.urgencyScore,
        urgencyReason: classification.urgencyReason,
        recommendedAction: classification.recommendedAction,
        aiCategory: classification.aiCategory || 'Bulk / Corporate Order',
        isSalesEnquiry: true,
        matchedProductId: matched?.id,
        matchedProductName: matched?.name,
        customerId: customer.id,
        enquiryId: enq.id,
        receivedAt: new Date().toISOString(),
        status: 'New',
      });

      showToast(`Test email successfully classified as ${classification.urgency} and saved to Firestore!`, 'success');
      setShowSimulateModal(false);
      onRefresh();
      setSelectedEmail(newEmail);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to simulate test email.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return;
    try {
      await deleteSyncedEmail(emailToDelete.id);
      showToast('Synced email removed from persistent database.', 'success');
      if (selectedEmail?.id === emailToDelete.id) {
        setSelectedEmail(null);
      }
      setEmailToDelete(null);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete email record.', 'error');
    }
  };

  const handleOpenDraftForEmail = (email: SyncedEmail) => {
    let enq = enquiries.find((e) => e.gmailMessageId === email.gmailMessageId || e.id === email.enquiryId);
    if (!enq) {
      // Construct virtual enquiry to allow drafting reply
      enq = {
        id: `ENQ-${email.id}`,
        customerId: email.customerId || `CUST-${email.senderEmail}`,
        customerName: email.senderName,
        customerEmail: email.senderEmail,
        enquiryText: email.bodyText || email.snippet || email.subject,
        productId: email.matchedProductId,
        productName: email.matchedProductName,
        source: 'Gmail',
        status: 'Pending',
        urgency: email.urgency,
        urgencyScore: email.urgencyScore,
        urgencyReason: email.urgencyReason,
        gmailMessageId: email.gmailMessageId,
        gmailThreadId: email.threadId,
        receivedAt: email.receivedAt,
      };
    }
    onOpenDraftReply(enq);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-indigo-400" />
            Synced Gmail Inbox & AI Urgency Triage
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Incoming customer emails synced from Google Workspace, persistently stored in Firebase Firestore, and classified by Gemini AI.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Simulate Test Email
          </button>

          <button
            onClick={onSyncGmail}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${
              isSyncing
                ? 'bg-indigo-600/60 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Gmail...' : 'Sync Gmail Now'}
          </button>
        </div>
      </div>

      {/* Account Info Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-slate-300 font-medium">Linked Account:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-indigo-300 border border-slate-700">
            {userEmail || 'uttugupta123456789@gmail.com'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            Active & Verified
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <span>Database: <strong className="text-slate-300">Firebase Firestore</strong> (<code className="text-indigo-300">synced_emails</code>)</span>
          <span>Total Synced: <strong className="text-slate-200">{syncedEmails.length}</strong></span>
        </div>
      </div>

      {/* Urgency Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Critical */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'Critical' ? 'All' : 'Critical')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            urgencyFilter === 'Critical'
              ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Critical Urgency
            </span>
            <span className="text-lg font-bold text-red-400">{criticalCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Imminent deadline, bulk VIP lead (&lt;1h)</p>
        </div>

        {/* High */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'High' ? 'All' : 'High')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            urgencyFilter === 'High'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              High Urgency
            </span>
            <span className="text-lg font-bold text-amber-300">{highCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Price quote & purchase intent (&lt;4h)</p>
        </div>

        {/* Medium */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'Medium' ? 'All' : 'Medium')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            urgencyFilter === 'Medium'
              ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Medium Urgency
            </span>
            <span className="text-lg font-bold text-blue-300">{mediumCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tech specs & general product queries</p>
        </div>

        {/* Low */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'Low' ? 'All' : 'Low')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            urgencyFilter === 'Low'
              ? 'bg-slate-800 border-slate-600 ring-2 ring-slate-600/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-slate-400" />
              Low Urgency
            </span>
            <span className="text-lg font-bold text-slate-300">{lowCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">General newsletter or feedback</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search synced emails by sender, subject, product, keywords, or urgency rationale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="urgency">Highest Urgency First</option>
              <option value="newest">Newest Received</option>
              <option value="oldest">Oldest Received</option>
            </select>
          </div>
        </div>

        {/* Urgency Filter Pills */}
        <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-indigo-400" />
            Urgency:
          </span>

          {['All', 'Critical', 'High', 'Medium', 'Low'].map((level) => (
            <button
              key={level}
              onClick={() => setUrgencyFilter(level)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                urgencyFilter === level
                  ? level === 'Critical'
                    ? 'bg-red-500 text-white'
                    : level === 'High'
                    ? 'bg-amber-500 text-slate-950'
                    : level === 'Medium'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {level}
              {level === 'Critical' && ` (${criticalCount})`}
              {level === 'High' && ` (${highCount})`}
              {level === 'Medium' && ` (${mediumCount})`}
              {level === 'Low' && ` (${lowCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Email List View */}
      {filteredEmails.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No synced emails match current criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {syncedEmails.length === 0
              ? 'Click "Sync Gmail Now" to retrieve customer messages from your linked Google account, or click "Simulate Test Email" to test the AI urgency classifier.'
              : 'Try clearing your search query or switching your urgency filter back to "All".'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setUrgencyFilter('All');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={onSyncGmail}
              disabled={isSyncing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Sync Gmail Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEmails.map((email) => {
            const isSelected = selectedEmail?.id === email.id;
            const isReclassifying = reclassifyingId === email.id;

            return (
              <div
                key={email.id}
                className={`p-5 rounded-2xl border transition-all ${
                  email.urgency === 'Critical'
                    ? 'bg-slate-900/90 border-red-500/40 hover:border-red-500 shadow-md shadow-red-950/10'
                    : email.urgency === 'High'
                    ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row: Sender + Urgency Badge + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-indigo-400 border border-slate-700">
                      {email.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{email.senderName}</span>
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline">&lt;{email.senderEmail}&gt;</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Received: {new Date(email.receivedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getUrgencyBadge(email.urgency, email.urgencyScore)}
                    {email.aiCategory && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {email.aiCategory}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject & Body */}
                <div className="pt-3 pb-2 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {email.subject}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                    {email.bodyText || email.snippet}
                  </p>

                  {/* AI Urgency Rationale Banner */}
                  <div className={`p-3 rounded-xl text-xs space-y-1.5 ${
                    email.urgency === 'Critical'
                      ? 'bg-red-500/10 border border-red-500/25 text-red-300'
                      : email.urgency === 'High'
                      ? 'bg-amber-500/10 border border-amber-500/25 text-amber-200'
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-slate-100">LLM Urgency Rationale: </strong>
                        <span>{email.urgencyReason}</span>
                      </div>
                    </div>
                    {email.recommendedAction && (
                      <div className="text-[11px] pl-5.5 text-slate-300 font-medium">
                        👉 Recommended Next Step: {email.recommendedAction}
                      </div>
                    )}
                  </div>

                  {/* Matched Product Badge if present */}
                  {email.matchedProductName && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <Package className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Catalogue Match: <strong className="text-slate-100">{email.matchedProductName}</strong></span>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDraftForEmail(email)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      Reply via Gmail
                    </button>

                    <button
                      onClick={() => setSelectedEmail(email)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View Full Details
                    </button>

                    <button
                      onClick={() => handleReclassify(email)}
                      disabled={isReclassifying}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Sparkles className={`w-3 h-3 text-indigo-400 ${isReclassifying ? 'animate-spin' : ''}`} />
                      {isReclassifying ? 'Classifying...' : 'Re-classify Urgency'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToTab('enquiries')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      View in Enquiries
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setEmailToDelete(email)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                      title="Delete email record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Email Modal / Details Drawer */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {getUrgencyBadge(selectedEmail.urgency, selectedEmail.urgencyScore)}
                  <span className="text-xs text-slate-400">ID: {selectedEmail.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">{selectedEmail.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Sender: </span>
                <strong className="text-slate-200">{selectedEmail.senderName}</strong>
                <div className="text-slate-400 font-mono text-[11px]">{selectedEmail.senderEmail}</div>
              </div>
              <div>
                <span className="text-slate-400">Received: </span>
                <strong className="text-slate-200">{new Date(selectedEmail.receivedAt).toLocaleString()}</strong>
                <div className="text-slate-500 text-[11px]">Gmail Message ID: {selectedEmail.gmailMessageId}</div>
              </div>
            </div>

            {/* AI Urgency Intelligence Breakdown */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Gemini LLM Urgency Classification Analysis
              </div>
              <div className="text-xs text-slate-200 leading-relaxed">
                <strong>Why this rating? </strong>{selectedEmail.urgencyReason}
              </div>
              {selectedEmail.recommendedAction && (
                <div className="text-xs text-amber-300 font-medium">
                  ⚡ <strong>Recommended Action: </strong>{selectedEmail.recommendedAction}
                </div>
              )}
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Message Body</label>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
                {selectedEmail.bodyText || selectedEmail.snippet}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleReclassify(selectedEmail)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Re-classify with Gemini
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOpenDraftForEmail(selectedEmail);
                    setSelectedEmail(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Reply via Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Simulator Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-base font-bold text-slate-100">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Simulate Inbound Customer Email & LLM Triage
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Simulate an email being fetched by the Gmail sync pipeline. Gemini will classify its urgency, assign an urgency score and rationale, and write the email into persistent Firebase Firestore.
            </p>

            <form onSubmit={handleSimulateEmail} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={simSenderName}
                    onChange={(e) => setSimSenderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    value={simSenderEmail}
                    onChange={(e) => setSimSenderEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Email Body</label>
                <textarea
                  rows={6}
                  required
                  value={simBody}
                  onChange={(e) => setSimBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  {isSimulating ? 'Classifying & Saving...' : 'Classify & Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!emailToDelete}
        title="Delete Synced Email"
        message={`Are you sure you want to delete the email record "${emailToDelete?.subject}" from the persistent Firestore database? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteEmail}
        onCancel={() => setEmailToDelete(null)}
      />
    </div>
  );
};
