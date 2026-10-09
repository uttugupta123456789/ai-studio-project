import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
  requestGmailOAuthToken,
} from './lib/firebase';
import {
  getCustomers,
  getProducts,
  getEnquiries,
  getCommunications,
  calculateStats,
  seedInitialDataIfEmpty,
  createCustomer,
  createEnquiry,
  createCommunication,
} from './lib/dataService';
import { Customer, Product, Enquiry, Communication, DashboardStats } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AiAgentView } from './components/AiAgentView';
import { EnquiriesView } from './components/EnquiriesView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { CommunicationsView } from './components/CommunicationsView';
import { GmailSettingsView } from './components/GmailSettingsView';
import { DraftReplyModal } from './components/DraftReplyModal';
import { RefreshCw, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Database Collections
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Modal State for Draft Reply
  const [draftReplyEnquiry, setDraftReplyEnquiry] = useState<Enquiry | null>(null);

  // Initialize Auth State Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessTokenState(token);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setAccessTokenState(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Show auto-dismissing toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch all collections from Firestore
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // 1. Seed initial database if empty
      await seedInitialDataIfEmpty();

      // 2. Load all records
      const [custs, prods, enqs, comms] = await Promise.all([
        getCustomers(),
        getProducts(),
        getEnquiries(),
        getCommunications(),
      ]);

      setCustomers(custs);
      setProducts(prods);
      setEnquiries(enqs);
      setCommunications(comms);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Google Login with Gmail Scopes
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessTokenState(result.accessToken);
        showToast(`Signed in as ${result.user.displayName || result.user.email}. Gmail API access active!`, 'success');
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        !err?.message?.includes('popup-closed-by-user') &&
        !err?.message?.includes('cancelled-popup-request')
      ) {
        console.warn('Sign-in issue:', err?.message || err);
        showToast(err.message || 'Failed to sign in with Google.', 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessTokenState(null);
      showToast('Signed out successfully.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Connect Gmail via Google Identity Services
  const handleConnectGmail = async () => {
    try {
      const token = await requestGmailOAuthToken(user?.email || undefined);
      if (token) {
        setAccessTokenState(token);
        setAccessToken(token);
        showToast('Gmail account connected and authorized!', 'success');
      }
    } catch (err: any) {
      if (
        err?.message?.includes('popup_closed') ||
        err?.message?.includes('closed by user')
      ) {
        return;
      }
      console.warn('Gmail OAuth error:', err?.message || err);
      showToast(err.message || 'Failed to authorize Gmail account.', 'error');
    }
  };

  // Sync Gmail API
  const handleSyncGmail = async () => {
    if (isSyncing) return;
    const token = await getAccessToken();

    if (!token) {
      showToast('Please sign in with Google to authorize Gmail synchronization.', 'error');
      setActiveTab('settings');
      return;
    }

    setIsSyncing(true);
    try {
      const knownIds = enquiries
        .map((e) => e.gmailMessageId)
        .filter(Boolean) as string[];

      const res = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          knownMessageIds: knownIds,
          products,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to sync with Gmail API');
      }

      const syncResult = await res.json();
      const messages = syncResult.messages || [];

      let importedEnquiries = 0;
      for (const msg of messages) {
        if (!msg.aiExtraction?.isSalesEnquiry) continue;

        // Match or create Customer
        let customer = customers.find(
          (c) => c.email.toLowerCase() === msg.senderEmail.toLowerCase()
        );

        if (!customer) {
          customer = await createCustomer({
            name: msg.senderName || msg.aiExtraction.customerName || 'Customer',
            email: msg.senderEmail,
            notes: `Auto-imported from Gmail message: "${msg.subject}"`,
          });
        }

        // Create Enquiry
        const enq = await createEnquiry({
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          enquiryText: msg.aiExtraction.enquiryText || msg.bodyText || msg.snippet,
          productId: msg.aiExtraction.matchedProductId || undefined,
          productName: msg.aiExtraction.matchedProductName || undefined,
          source: 'Gmail',
          status: 'Pending',
          gmailMessageId: msg.gmailMessageId,
          gmailThreadId: msg.threadId,
          receivedAt: msg.date,
        });

        // Create Communication Log
        await createCommunication({
          customerId: customer.id,
          enquiryId: enq.id,
          channel: 'Gmail',
          direction: 'Incoming',
          subject: msg.subject,
          messageBody: msg.bodyText || msg.snippet,
          status: 'Received',
          gmailMessageId: msg.gmailMessageId,
          sentOrReceivedAt: msg.date,
        });

        importedEnquiries++;
      }

      await loadData();

      if (importedEnquiries > 0) {
        showToast(`Gmail sync complete: ${importedEnquiries} new sales enquiries imported!`, 'success');
      } else {
        showToast(
          `Gmail scanned: ${syncResult.totalScanned || 0} messages checked. No new sales enquiries found.`,
          'info'
        );
      }
    } catch (err: any) {
      console.error('Gmail sync error:', err);
      showToast(err.message || 'Failed to sync Gmail messages.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Compute Dashboard Statistics
  const stats: DashboardStats = calculateStats(customers, products, enquiries);

  // Quick AI query navigation helper
  const handleQuickAiQuery = (prompt: string) => {
    setActiveTab('ai-agent');
    // We can pass this or user will see suggested chips
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-medium backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        isGmailConnected={!!accessToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSyncGmail={handleSyncGmail}
        onConnectGmail={handleConnectGmail}
        isSyncing={isSyncing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingEnquiriesCount={stats.pendingEnquiries}
        />

        {/* View Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {isLoadingData ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs font-medium">Connecting to Firestore & loading store catalogue...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  customers={customers}
                  products={products}
                  enquiries={enquiries}
                  communications={communications}
                  user={user}
                  isGmailConnected={!!accessToken}
                  accessToken={accessToken}
                  onLogin={handleLogin}
                  onConnectGmail={handleConnectGmail}
                  onSyncGmail={handleSyncGmail}
                  isSyncing={isSyncing}
                  onOpenDraftReply={(enq) => setDraftReplyEnquiry(enq)}
                  onSelectCustomer={(cust) => setActiveTab('customers')}
                  onSelectProduct={(prod) => setActiveTab('products')}
                  onSelectEnquiry={(enq) => setActiveTab('enquiries')}
                  onQuickAiQuery={handleQuickAiQuery}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'ai-agent' && (
                <AiAgentView
                  customers={customers}
                  products={products}
                  enquiries={enquiries}
                  communications={communications}
                  onOpenDraftReply={(enq) => setDraftReplyEnquiry(enq)}
                  onSelectCustomer={(cust) => setActiveTab('customers')}
                  onSelectProduct={(prod) => setActiveTab('products')}
                  onSelectEnquiry={(enq) => setActiveTab('enquiries')}
                />
              )}

              {activeTab === 'enquiries' && (
                <EnquiriesView
                  enquiries={enquiries}
                  customers={customers}
                  products={products}
                  communications={communications}
                  onOpenDraftReply={(enq) => setDraftReplyEnquiry(enq)}
                  onSelectCustomer={(cust) => setActiveTab('customers')}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  enquiries={enquiries}
                  communications={communications}
                  onOpenDraftReply={(enq) => setDraftReplyEnquiry(enq)}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'products' && (
                <ProductsView products={products} onRefresh={loadData} />
              )}

              {activeTab === 'communications' && (
                <CommunicationsView
                  communications={communications}
                  customers={customers}
                  enquiries={enquiries}
                />
              )}

              {activeTab === 'settings' && (
                <GmailSettingsView
                  user={user}
                  isGmailConnected={!!accessToken}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onSyncGmail={handleSyncGmail}
                  onConnectGmail={handleConnectGmail}
                  isSyncing={isSyncing}
                  customers={customers}
                  products={products}
                  enquiries={enquiries}
                  onRefresh={loadData}
                  onSetManualToken={(tok) => {
                    setAccessTokenState(tok);
                    setAccessToken(tok);
                    showToast('Gmail Access Token applied! You can now sync recent emails.', 'success');
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* AI Draft Reply Modal */}
      {draftReplyEnquiry && (
        <DraftReplyModal
          isOpen={!!draftReplyEnquiry}
          onClose={() => setDraftReplyEnquiry(null)}
          enquiry={draftReplyEnquiry}
          customer={customers.find((c) => c.id === draftReplyEnquiry.customerId)}
          product={products.find((p) => p.id === draftReplyEnquiry.productId)}
          isGmailConnected={!!accessToken}
          onSuccess={() => {
            showToast('Response successfully recorded and sent!', 'success');
            loadData();
          }}
        />
      )}
    </div>
  );
}
