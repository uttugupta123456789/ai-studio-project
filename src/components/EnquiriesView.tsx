import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Trash2,
  Mail,
  User,
  Package,
  Calendar,
  X,
} from 'lucide-react';
import { Enquiry, Customer, Product, Communication, EnquiryStatus, EnquirySource } from '../types';
import { createEnquiry, updateEnquiry, deleteEnquiry } from '../lib/dataService';
import { ConfirmModal } from './ConfirmModal';

interface EnquiriesViewProps {
  enquiries: Enquiry[];
  customers: Customer[];
  products: Product[];
  communications: Communication[];
  onOpenDraftReply: (enquiry: Enquiry) => void;
  onSelectCustomer: (customer: Customer) => void;
  onRefresh: () => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  enquiries,
  customers,
  products,
  communications,
  onOpenDraftReply,
  onSelectCustomer,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<Enquiry | null>(null);

  // New Enquiry Form State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [productId, setProductId] = useState('');
  const [enquiryText, setEnquiryText] = useState('');
  const [source, setSource] = useState<EnquirySource>('Manual');
  const [status, setStatus] = useState<EnquiryStatus>('Pending');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter logic
  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (enq.productName && enq.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      enq.enquiryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || enq.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || enq.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCustomerId(selectedId);
    const found = customers.find((c) => c.id === selectedId);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email);
    } else {
      setCustomerName('');
      setCustomerEmail('');
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !enquiryText) return;

    setIsSubmitting(true);
    try {
      const selectedProd = products.find((p) => p.id === productId);

      await createEnquiry({
        customerId: customerId || `CUST-MANUAL-${Date.now()}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        enquiryText: enquiryText.trim(),
        productId: selectedProd ? selectedProd.id : undefined,
        productName: selectedProd ? selectedProd.name : undefined,
        source,
        status,
        assignedStaff: assignedStaff.trim() || undefined,
        receivedAt: new Date().toISOString(),
      });

      setIsCreateModalOpen(false);
      resetForm();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (enquiry: Enquiry, newStatus: EnquiryStatus) => {
    try {
      await updateEnquiry(enquiry.id, { status: newStatus });
      onRefresh();
      if (selectedEnquiry && selectedEnquiry.id === enquiry.id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!enquiryToDelete) return;
    try {
      await deleteEnquiry(enquiryToDelete.id);
      if (selectedEnquiry?.id === enquiryToDelete.id) {
        setSelectedEnquiry(null);
      }
      setEnquiryToDelete(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setCustomerName('');
    setCustomerEmail('');
    setProductId('');
    setEnquiryText('');
    setSource('Manual');
    setStatus('Pending');
    setAssignedStaff('');
  };

  const getStatusBadge = (s: EnquiryStatus) => {
    switch (s) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress
          </span>
        );
      case 'Responded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Responded
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Closed
          </span>
        );
    }
  };

  // Find linked communications for selected enquiry
  const selectedComms = selectedEnquiry
    ? communications.filter((c) => c.enquiryId === selectedEnquiry.id || c.customerId === selectedEnquiry.customerId)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-indigo-400" />
            Customer Enquiries Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track customer sales enquiries, inquiries imported from Gmail, and response status
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Enquiry</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enquiries by customer, email, product, or text..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Responded">Responded</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Sources</option>
              <option value="Gmail">Gmail</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>
            Showing <strong className="text-slate-200">{filteredEnquiries.length}</strong> of{' '}
            {enquiries.length} enquiries
          </span>
          {statusFilter !== 'All' && (
            <button
              onClick={() => setStatusFilter('All')}
              className="text-indigo-400 hover:underline"
            >
              Clear status filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table or Card View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Enquiry ID / Customer</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Related Product</th>
                <th className="px-4 py-3">Source & Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEnquiries.map((enq) => (
                <tr key={enq.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-200">{enq.customerName}</div>
                    <div className="text-[11px] text-slate-400">{enq.customerEmail}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{enq.id}</div>
                  </td>

                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="text-slate-300 line-clamp-2 leading-relaxed">
                      {enq.enquiryText}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 max-w-[180px]">
                    {enq.productName ? (
                      <span className="text-indigo-300 font-medium block truncate">
                        {enq.productName}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">None specified</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1 ${
                        enq.source === 'Gmail'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {enq.source}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(enq.receivedAt).toLocaleDateString()}{' '}
                      {new Date(enq.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {getStatusBadge(enq.status)}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onOpenDraftReply(enq)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        Reply
                      </button>
                      <button
                        onClick={() => setEnquiryToDelete(enq)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete enquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No enquiries match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiry Detail Drawer / Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    Enquiry Details
                    <span className="text-xs text-slate-400 font-normal">#{selectedEnquiry.id}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Source: {selectedEnquiry.source}</span>
                    <span>·</span>
                    <span>{new Date(selectedEnquiry.receivedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Customer Info Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Customer
                  </span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">
                    {selectedEnquiry.customerName}
                  </p>
                  <p className="text-xs text-indigo-400">{selectedEnquiry.customerEmail}</p>
                </div>
                {customers.find((c) => c.id === selectedEnquiry.customerId) && (
                  <button
                    onClick={() => {
                      const c = customers.find((cust) => cust.id === selectedEnquiry.customerId);
                      if (c) onSelectCustomer(c);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    View Profile
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Updater */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <span className="text-slate-400 font-medium">Update Status:</span>
                <div className="flex items-center gap-2">
                  {(['Pending', 'In Progress', 'Responded', 'Closed'] as EnquiryStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedEnquiry, st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedEnquiry.status === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enquiry Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Customer Enquiry Message
                </label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.enquiryText}
                </div>
              </div>

              {/* Related Product */}
              {selectedEnquiry.productName && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Identified Product
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="font-medium text-slate-200">{selectedEnquiry.productName}</span>
                    {selectedEnquiry.productId && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        ID: {selectedEnquiry.productId}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Communication Thread for this enquiry */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Communication History ({selectedComms.length})
                </label>
                <div className="space-y-2.5">
                  {selectedComms.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-semibold ${comm.direction === 'Incoming' ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {comm.direction === 'Incoming' ? 'Incoming Email' : 'Sent Response'}
                        </span>
                        <span className="text-slate-500">
                          {new Date(comm.sentOrReceivedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-slate-300">{comm.subject}</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-wrap">{comm.messageBody}</p>
                    </div>
                  ))}

                  {selectedComms.length === 0 && (
                    <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950 rounded-xl">
                      No communications recorded for this enquiry yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setEnquiryToDelete(selectedEnquiry)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Enquiry
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onOpenDraftReply(selectedEnquiry);
                    setSelectedEnquiry(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Draft AI Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Enquiry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Create Customer Enquiry
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Select Existing Customer or Enter New */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Existing Customer (Optional)
                </label>
                <select
                  value={customerId}
                  onChange={handleCustomerSelect}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose registered customer or enter below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Related Product */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Related Product
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- General enquiry (no product) --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price.toLocaleString('en-IN')} ({p.availability})
                    </option>
                  ))}
                </select>
              </div>

              {/* Enquiry Text */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Enquiry Message / Questions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={enquiryText}
                  onChange={(e) => setEnquiryText(e.target.value)}
                  placeholder="What is the customer asking or inquiring about?"
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as EnquirySource)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="Manual">Manual Entry / In-Store</option>
                    <option value="Gmail">Gmail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EnquiryStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Responded">Responded</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Creating...' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={!!enquiryToDelete}
        title="Delete Enquiry"
        message={`Are you sure you want to delete enquiry #${enquiryToDelete?.id} from ${enquiryToDelete?.customerName}? This will permanently remove this record.`}
        confirmLabel="Delete Enquiry"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setEnquiryToDelete(null)}
      />
    </div>
  );
};
